import config, { updateStore } from '../../server/config'

export async function get(req, res) {
    return res.end(JSON.stringify(config))
}