'use strict'

const IPFS = require('ipfs-daemon/src/ipfs-browser-daemon')
const OrbitDB = require('orbit-db')

const elm = document.getElementById("output")
const openButton = document.getElementById("open")

const openDatabase = () => {
  elm.innerHTML = "Starting IPFS..."

  const dbname = "QmbVycmVAsdeP8ocXrF8yGDhiPdpbXocFhSu3Jtrfspfdx" //todo
  const username = new Date().getTime()
  const ipfs = new IPFS({
    IpfsDataDir: '/orbit-db-/examples/browser',
    SignalServer: 'star-signal.cloud.ipfs.team', // IPFS dev server
  }) 

  function handleError(e) {
    console.error(e.stack)
    elm.innerHTML = e.message  
  }

  ipfs.on('error', (e) => handleError(e))

  ipfs.on('ready', () => {
    elm.innerHTML = "Loading database..."

    const orbit = new OrbitDB(ipfs, username)
    //const log = orbit.eventlog(dbname + ".log", { maxHistory: 5, syncHistory: false, cachePath: '/orbit-db' })
    const log = orbit.eventlog(dbname + ".log", { cachePath: '/orbit-db' })

    const interval = Math.floor((Math.random() * 5000) + 3000)

    const query = () => {
      const value = document.getElementById("dbname").value
      log.add(value)
        .then(() => getData())
        .catch((e) => handleError(e))
    }
    openButton.addEventListener('click', query)
    
    function handleLogEntry(e) {
        const v = e.payload.value
        if (v.length == 46) {
            // assume we got an image hash
            return "<img src='/ipfs/" + v + "' />"
        } else {
            return v
        }
    }
    
    const getData = () => {
      const latest = log.iterator({ limit: 50 }).collect()
      elm.innerHTML = latest.reverse().map(handleLogEntry).join("<br>")
    }

    log.events.on('synced', () => getData())
    log.events.on('ready', () => getData())

    // Start query loop when the databse has loaded its history
    log.load()
      .then(() => {
        setInterval(getData, interval)
      })
  })
}

openDatabase()
