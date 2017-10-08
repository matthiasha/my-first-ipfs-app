'use strict'

const IPFS = require('ipfs-daemon/src/ipfs-browser-daemon')
const OrbitDB = require('orbit-db')

const elm = document.getElementById("output")
const openButton = document.getElementById("open")
const uploadButton = document.getElementById("upload")

const openDatabase = () => {
  elm.innerHTML = "Starting IPFS..."

  const dbname = "feed"
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
    const log = orbit.eventlog(dbname, { cachePath: '/orbit-db' })

    const interval = Math.floor((Math.random() * 5000) + 3000)

    function addlog(value) {
      log.add(value)
        .then(() => getData())
        .catch((e) => handleError(e))
    }

    const query = () => {
        const value = document.getElementById("dbname").value
        addlog(value)
    }
    openButton.addEventListener('click', query)


    function upload() {
        let file = uploadButton.files[0]
        let reader = new window.FileReader()
        reader.onloadend = () => {
            const buffer = Buffer.from(reader.result)
            ipfs._daemon.files.add(buffer)
                .then((response) => {
                    let hash = response[0].hash
                    if (file.type.startsWith("image/")) {
                        addlog("<img src='/ipfs/" + hash + "' />")
                    } else {
                        addlog("<a href='/ipfs/" + hash + "' >" + hash + "</a>")
                    }
                }).catch((err) => {
                    console.error(err)
                })
        }
        reader.readAsArrayBuffer(file)
    }

    uploadButton.addEventListener('change', upload)
    
    function handleLogEntry(e) {
        const v = e.payload.value
        return v
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
