import path from 'path';

export default {
    entry: ['./index.mjs'],
    target: 'web',

    output: {
        filename: 'sajilonet.js',
        path: path.resolve('./dist'),
        library: 'sajilonet'
    },
    mode: 'production'
}