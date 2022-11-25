import API from 'presonus-studiolive-api-simple-api'


export default (() => {
    let client: API;

    return {
        async connect(address: ConstructorParameters<typeof API>[0], d?: Parameters<API['connect']>[0]) {
            logger.info(`Connecting to StudioLive console at ${address.host}:${address.port || 5300}`)
            return new Promise((resolve) => {
                new API(address, { autoreconnect: true }).connect({ clientName: "MIDI Integration" }).then((c) => {
                    logger.info("Successfully connected to StudioLive console")
                    client = c
                    resolve(undefined)
                })
            })
        },

        withClient<F extends unknown>(f: (client: API) => F): F {
            if (!client) {
                logger.warn("Dropping client command as the console was not yet connected")
                return
            }

            return f(client)
        }
    }

})()

