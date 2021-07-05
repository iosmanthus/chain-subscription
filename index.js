const yaml = require('yaml');
const express = require('express');
const app = express();
const axios = require('axios');
const { createLogger, format, transports } = require('winston');
const { combine, timestamp, printf, colorize } = format;

const logger = createLogger({
    format: combine(
        colorize(),
        timestamp(),
        printf(({ level, message, timestamp }) => {
            return `${timestamp} [${level}]: ${message}`;
        })
    ),
    transports: [new transports.Console()]
});

const address = '8080';

app.get('/:subscription/:server/:port/:cipher/:password/:udp', async (req, res) => {
    const params = req.params;
    const sub = decodeURIComponent(params['subscription']);
    logger.info(`receive from ${req.ip}`)
    try {
        const { data } = (await axios.get(sub));
        const config = yaml.parse(data);
        const destServer = {
            name: 'Private',
            type: 'ss',
            server: params['server'],
            port: params['port'],
            cipher: params['cipher'],
            password: params['password'],
            udp: params['udp'] == "true",
        };
        const select = {
            name: 'Select',
            type: 'select',
            proxies: ['Auto - UrlTest', ...config['proxies'].map(s => s.name)]
        };
        const relay = {
            name: 'Relay',
            type: 'relay',
            proxies: [destServer.name, select.name]
        }

        config['proxy-groups'].forEach((value, index) => {
            if (value['name'] == 'Proxy') {
                config['proxy-groups'][index]['proxies'] = [relay.name, ...value['proxies']];
            }
        })
        config['proxy-groups'].push(select);
        config['proxy-groups'].push(relay);
        config['proxies'].push(destServer);
        logger.info('successfully fetched config');
        res.send(yaml.stringify(config));
    } catch (err) {
        logger.error(err);
        res.status(500).send(err.toString())
    }
});

app.listen(address, () => { logger.warn(`Listening at port: ${address}`) });