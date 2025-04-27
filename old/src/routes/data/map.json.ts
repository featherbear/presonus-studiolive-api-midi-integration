import config, { updateStore } from '../../server/config'

export async function get(req, res) {
    return res.end(JSON.stringify(config))
}

export async function put(req, res) {
    logger.info({ config: req.body }, "Writing configuration data")
    updateStore(req.body)
    return res.end(JSON.stringify({ json: true }))
}