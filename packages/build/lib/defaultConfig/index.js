
const DEFAULT_ENTRY_PATH = ''

const defaultScriptObj = function(type=''){
    return type ? {
        'react': {
            path: './config-overrides.js',
            
        },
        'vue': './webpack.conf.js'
    }[type] : false
}

module.exports = {
    defaultScriptObj
}