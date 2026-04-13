import pinyin from './pinyin';

export default {
    title: '風間の屋',
    domain:
        process.env.NODE_ENV === 'development'
            ? 'dev.miku.tools:3000'
            : 'miku.tools',
    description: '',
    url:
        process.env.NODE_ENV === 'development'
            ? 'http://dev.miku.tools:3000'
            : 'https://miku.tools',
    apiUrl:
        process.env.NODE_ENV === 'development'
            ? 'http://dev.miku.tools:3001'
            : 'https://api.miku.tools',
    pinyin: pinyin,
    development: process.env.NODE_ENV === 'development',
    axios:
        process.env.NODE_ENV === 'development'
            ? 'http://127.0.0.1:3001'
            : 'https://api.miku.tools'
};
