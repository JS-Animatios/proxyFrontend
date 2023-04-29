function limitText(limitField, limitNum) {
    if (limitField.value.length > limitNum) {
        limitField.value = limitField.value.substring(0, limitNum);
    } 
    limitField.value=limitField.value.toUpperCase()
    validate(limitField.value);
}
document.getElementById('deviceValidation').addEventListener('input', function(){
    limitText(document.getElementById('deviceValidation'), 10)
})

function validate(value){
    try{
        var user_ref = database.ref('users'+ "/" + [value])
        
            user_ref.once("value", function(snapshot) {
                var data = snapshot.val();
                document.getElementById('deviceValidationtxt').innerHTML=data.claimable;


                if(data.claimable =='true'){
                    //user pairing id was validated
                    database.ref('users/' + [value]).update({
                        'claimable' : 'false'
                    })
                    localStorage.setItem('token', value)
                    window.location.reload()
                }else{if(value!='')document.getElementById('deviceValidationtxt').innerHTML=('account already claimed')}





            })
        }catch{
            document.getElementById('deviceValidationtxt').innerHTML=('unauthorized paring ID')
        }
}


    if(localStorage.getItem('token')){
        var user_ref = database.ref('users'+ "/" + [localStorage.getItem('token')])
        
            user_ref.once("value", function(snapshot) {
                var data = snapshot.val();
                if(data){
                    //token validated
                    document.getElementById('deviceValidationtxt').innerHTML='allowed'
                    document.getElementById('verify').remove()

                    var name = document.createElement('h1')
                    name.innerHTML='<span style="font-size:50px;">Welcome </span>'+data.name
                    name.style.color="white"
                    name.style.fontSize="100px"
                    name.style.marginLeft="100px"
                    document.body.appendChild(name)
                    var start = document.createElement('button')
                    start.innerHTML='Continue'
                    start.style.color="black"
                    start.style.borderRadius="10px"
                    start.style.border="none"
                    start.style.backgroundColor="grey"
                    start.style.fontSize="20px"
                    start.style.marginLeft="600px"
                    start.style.marginTop="10px"
                    document.body.appendChild(start)
                    start.onclick=function(){
                        start.innerHTML='...'
                        setTimeout(() => {
                            name.remove()
                        start.remove()
                        var ifr = document.createElement('iframe');
                        ifr.src='https://ultrablock.up.railway.app'
                        ifr.style.height='100%'
                        ifr.style.width='100%'
                        ifr.style.position='absolute'
                        ifr.style.border='none'
                        document.body.appendChild(ifr)
                        }, 100);
                        
                    }

                }else{
                    document.getElementById('deviceValidationtxt').innerHTML='denied'
                }
            })
    }
