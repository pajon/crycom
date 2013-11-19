module.exports = {
    debug: true,
    sandbox: true, // N - N contacts
    client: {
        noop: 10 // seconds
    },
    address: {
        size: 64 // size in hex format
    },
    message: {
        size: 24 // size in hex format
    },
    packet: {
        PACKET_MESSAGE: 0,
        PACKET_MESSAGE_LIST: 1,
        PACKET_MESSAGE_NEW: 2,
        PACKET_MESSAGE_GET: 3,
        PACKET_MESSAGE_QUERY: 4,

        PACKET_AUTH: 1,
        PACKET_AUTH_START: 1,
        PACKET_AUTH_HASH: 2,
        PACKET_AUTH_DATA: 3,
        PACKET_AUTH_ACCEPT: 4,
        PACKET_AUTH_REJECT: 5,
        PACKET_AUTH_REGISTER: 6,
        PACKET_AUTH_REGISTER_ACCEPT: 7,
        PACKET_AUTH_REGISTER_REJECT: 8,

        PACKET_CONTACT: 6,
        PACKET_CONTACT_LIST: 1,
        PACKET_CONTACT_ADD: 2,
        PACKET_CONTACT_ACCEPT: 3,
        PACKET_CONTACT_REJECT: 4,
        PACKET_CONTACT_PUBKEY: 5,
        PACKET_CONTACT_RELOAD: 6,

        PACKET_SYSTEM: 8,
        PACKET_SYSTEM_LIVE: 1
    }
};