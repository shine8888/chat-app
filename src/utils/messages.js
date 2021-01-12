const generateMessage = (text, username) => {
    return {
        text: text,
        createdAt: new Date().getTime(),
        username
    };
};

module.exports = { generateMessage };