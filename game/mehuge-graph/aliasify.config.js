module.exports = {
    replacements: {
        "^UI/(\\w+)": ".\\build\\transpiled\\components\\UI\\$1",
        "^lib/(\\w+)": ".\\build\\transpiled\\lib\\$1",
        "^components/(\\w+)": ".\\build\\transpiled\\components\\$1",
    },
    verbose: false
};
