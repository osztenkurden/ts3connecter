const { Telnet } = require('telnet-client')
const wait = ms => new Promise(r => setTimeout(r, ms));
const main = async () => {

    const connection = new Telnet()

    // these parameters are just examples and most probably won't work for your use-case.
    const params = {
        host: '135.125.200.151',
        port: 10011,
        negotiationMandatory: false, // or negotiationMandatory: false
        timeout: 1500
    }

    try {
        await connection.connect(params)
    } catch (error) {
        // handle the throw (timeout)
    }
    
    const res = await connection.write('login serveradmin test1234\r\n')
    console.log('async result:', res)
    const res1 = await connection.write('use sid=1\r\n')

    for(let i = 0; i < 10; i++){
        await wait(100);
        const res2 = await connection.write('clientlist -voice\r\n')
        
        console.log('async result:', res2.split('\n').map(x => x.split('|')).flat())
    }
}
main();