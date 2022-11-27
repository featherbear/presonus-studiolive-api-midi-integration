//  // Log before actual functionality
//  logger.info({ deviceName: (_device as easymidi.Input)?.name ?? _device }, "Attaching to MIDI device")


//  device.on('noteon', function (data: Note) {
//      let note = data.note.toString()

//      let noteConfig = config.notes[note]
//      if (!noteConfig) return

//      if (noteConfig.latch && noteLatches[note]) {
//          noteLatches[note] = false
//          handleNoteAction(noteConfig.onRelease, noteConfig)
//      } else {
//          if (noteConfig.latch) noteLatches[note] = true
//          handleNoteAction(noteConfig.onPress, noteConfig)
//      }
//  })

//  device.on('noteoff', function (data: Note) {
//      let note = data.note.toString()

//      let noteConfig = config.notes[note]
//      if (!noteConfig) return
//      if (noteConfig.latch) return

//      handleNoteAction(noteConfig.onRelease, noteConfig)
//  })

//  device.on('cc', function (data: ControlChange) {
//      let controller = data.controller.toString()

//      let controllerConfig = config.controllers[controller]
//      if (!controllerConfig) return

//      switch (controllerConfig.type) {
//          case 'volume': {
//              return client.setChannelVolumeLinear(controllerConfig.selector, Math.trunc(data.value / 127 * 100))
//          }
//      }
//  })

//  // Global feedback
//  if (typeof opts?.eventCallback === 'function') {
//      device.on('message' as any, function (data) {
//          opts.eventCallback({ ...data, device: device.name })
//      })
//  }


//  let outputDevice: easymidi.Output
//  if (opts.feedbackDevice || outputDevices.includes(device.name)) {
//      outputDevice = opts.feedbackDevice || new easymidi.Output(device.name)

//      for (let [note, obj] of Object.entries(config.notes)) {
//          if (['mute', 'unmute'].includes(obj.onPress)) {
//              function update(state?) {
//                  let isMute = state ?? (client.state.get(parseChannelString(obj.selector) + '/mute') || false)

//                  if (isMute) {
//                      outputDevice.send('noteon', {
//                          channel: 10, // TODO:
//                          note: Number(note),
//                          velocity: 127
//                      })
//                  } else {
//                      outputDevice.send('noteoff', {
//                          channel: 10, // TODO:
//                          note: Number(note),
//                          velocity: 0
//                      })
//                  }
//              }

//              evtProxy_mute.on(parseChannelString(obj.selector), update)
//              update()
//          }
//      }

//      for (let [controller, obj] of Object.entries(config.controllers)) {
//          if (obj.type === 'volume') {
//              function update(level?) {
//                  let vol100 = level ?? (client.state.get(parseChannelString(obj.selector) + '/volume') || 0)
//                  let vol = Math.trunc(vol100 * 127 / 100)
//                  outputDevice.send('cc', {
//                      channel: 10, // TODO:
//                      controller: Number(controller),
//                      value: vol
//                  })
//              }

//              evtProxy_level.on(parseChannelString(obj.selector), update)
//              update()

//          }
//      }

//  } else {
//      logger.debug("Skip feedback device setup for " + device.name)
//  }

//  let closeCheckTimer =
//      setInterval(() => {
//          if (!device.isPortOpen()) {
//              clearInterval(closeCheckTimer)
//              logger.warn({ device: device.name }, "MIDI device was disconnected")
//          }
//      }, 2000)


//   let noteLatches = {}
// 
// function handleNoteAction(action: NoteAction, noteConfig: typeof config['notes'][string]) {
//     if (!action) return

//     console.log(action, noteConfig)

//     switch (action) {
//         case 'mute': {
//             return client.setMute(noteConfig.selector, true)
//         }
//         case 'unmute': {
//             return client.setMute(noteConfig.selector, false)
//         }
//     }
// }