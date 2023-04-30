const sysstatus = window.navigator.onLine;
if(sysstatus) console.log('hi')
else offline()

document.getElementById('onlinecontainer').style.display = 'block';
//document.getElementById('onlinecontainer').style.top='60';

window.addEventListener('online', online);
window.addEventListener('offline', offline);

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
    document.getElementById('onlinecontainer').style.top='100';
async function online(){

    await sleep(1000);
    document.getElementById('onlinecontainer').style.top='0px';
    document.getElementById('onlinecontainer').style.backgroundColor = 'green';
    document.getElementById('statspan').textContent = 'Online';
    if(document.getElementById('deviceValidation')){
        document.getElementById('deviceValidation').disabled=false;
        document.getElementById('deviceValidation').style.backgroundColor='rgb(45, 45, 45)'
    }
    await sleep(2500);
    document.getElementById('onlinecontainer').style.top='-100px';
}

async function offline(){
    await sleep(1000);
    document.getElementById('onlinecontainer').style.top='0px';
    document.getElementById('onlinecontainer').style.backgroundColor = 'red';
    document.getElementById('statspan').textContent = 'Offline';
    if(document.getElementById('deviceValidation')){
        document.getElementById('deviceValidation').disabled=true;
        document.getElementById('deviceValidation').style.backgroundColor='grey'
    }

    
}