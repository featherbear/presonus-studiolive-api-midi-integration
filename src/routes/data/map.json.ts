import config, { updateStore } from '../../server/config'

export async function get(req, res) {
    return res.end(JSON.stringify(config))
}

export async function put(req, res) {
    console.log(req.body);
    // updateStore
    return res.end(":)")
}