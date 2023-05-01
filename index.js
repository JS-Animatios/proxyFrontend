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

                    document.getElementById('terms').style.display='block'
                    document.getElementById('deviceValidation').addEventListener('input', function(){
                        if(document.getElementById('deviceValidation').value=='START'){
                            localStorage.setItem('token', value)
                            database.ref('users/' + [value]).update({
                                'claimable' : 'false'
                            })
                            window.location.reload()
                        }
                    })
                    
                    
                    
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
                        ifr.id='embededIfr'
                        document.body.appendChild(ifr)
                        }, 100);
                        
                    }


                    //check suspension

                    var user_ref = database.ref('users'+ "/" + localStorage.getItem('token'))
                    user_ref.once("value", function(snapshot) {
                    var data = snapshot.val();
                    console.log(data.suspended);
                    const suspendedTime = Date.now()
                    console.log(suspendedTime)
                    if(data.suspended>suspendedTime){
                        start.disabled=true;
                        start.innerHTML='Account suspended, time left in sentance: '+(data.suspended-suspendedTime)+" ms."
                    }
                  })


                        setInterval(() => {
                            var user_ref = database.ref('users'+ "/" + localStorage.getItem('token'))
                            user_ref.once("value", function(snapshot) {
                            var data = snapshot.val();
                            const suspendedTime = Date.now()
                            if(data.suspended>suspendedTime){
                                start.disabled=true;
                                start.innerHTML='Account suspended, time left in sentance: '+(data.suspended-suspendedTime)+" ms."
                                if(document.getElementById('embededIfr')){
                                    document.getElementById('embededIfr').remove()
                                    window.location.reload()
                                }
                            }else{
                                start.disabled=false;
                                start.innerHTML="Continue"
                                database.ref('users/' + [localStorage.getItem('token')]).update({
                                    suspended : 0
                                })
                            }
                          })
                        }, 100);







                    if(data.admin=="true"){
                        var adminButton = document.createElement('button')
                        adminButton.innerHTML='Console'
                        adminButton.style.color="lightblue"
                        adminButton.style.borderRadius="5px"
                        adminButton.style.border="none"
                        adminButton.style.backgroundColor="transparent"
                        adminButton.style.fontSize="20px"

                        adminButton.style.float="right"
                        adminButton.style.marginTop="-225px"
                        adminButton.style.position='absolute'

                        document.body.appendChild(adminButton)
                        adminButton.onmouseover=function(){
                            adminButton.style.backgroundColor='rgba(100, 100, 155, 255)'
                        }
                        adminButton.onmouseleave=function(){
                            adminButton.style.backgroundColor='transparent'
                        }
                        adminButton.onclick=function(){
                            var adminConsole = document.createElement('div');
                            adminConsole.style.height="100%";
                            adminConsole.style.width="100%";
                            adminConsole.style.position="absolute";
                            adminConsole.style.backgroundColor="black";
                            adminConsole.id='adminConsole'
                            document.body.appendChild(adminConsole);
                            var dropdown = document.createElement('select')
                            dropdown.id='userDrop'
                            document.getElementById('adminConsole').appendChild(dropdown)


                                var user_ref = database.ref('number'+'')
                            user_ref.once("value", function(snapshot) {
                            var data1 = snapshot.val();
                             console.log(data1)
                             
                            for(let i=0; i<data1;i++){
                                
                                var user_ref = database.ref('id/' + i)
                                user_ref.once("value", function(snapshot) {
                                var data = snapshot.val();
                                console.log(data)
                                var option = document.createElement('option')
                                option.innerHTML=data
                                dropdown.appendChild(option)
                            })
                            

                               
                                
                            }
                            var placehold = document.createElement('option')
                            placehold.innerHTML='-------'
                            dropdown.appendChild(placehold)
                            var optionNew = document.createElement('option')
                            optionNew.innerHTML='New user'
                            dropdown.appendChild(optionNew)
                        })


                        var settingsDiv = document.createElement('div');
                        settingsDiv.style.height='300px'
                        settingsDiv.style.width='200px'
                        settingsDiv.style.backgroundColor='white'
                        adminConsole.appendChild(settingsDiv)
                        var oldval = dropdown.value;
                        setInterval(() => {
                            if(oldval!==dropdown.value){
                                settingsDiv.innerHTML=''
                                if(dropdown.value=='New user'){
                                    var header=document.createElement('span')
                                    header.innerHTML='Create new user'
                                    settingsDiv.appendChild(header)
                                    var inputName=document.createElement('input')
                                    inputName.placeholder='New user name'
                                    settingsDiv.appendChild(inputName)

                                    var inputSuspension=document.createElement('input')
                                    inputSuspension.placeholder='Suspension time'
                                    settingsDiv.appendChild(inputSuspension)

                                    var inputID=document.createElement('input')
                                    inputID.placeholder='User Pairing ID'
                                    settingsDiv.appendChild(inputID)
                                    
                                    var inputClaimable=document.createElement('input')
                                    inputClaimable.placeholder='User claimable'
                                    settingsDiv.appendChild(inputClaimable)

                                    var inputAdmin=document.createElement('input')
                                    inputAdmin.placeholder='User admin'
                                    settingsDiv.appendChild(inputAdmin)

                                    var submit=document.createElement('button')
                                    submit.innerHTML='-  Add  -'
                                    settingsDiv.appendChild(submit)

                                    submit.onclick=function(){
                                        database.ref('users/' + inputID.value).set({
                                            name : inputName.value,
                                            suspended : inputSuspension.value,
                                            claimable : inputClaimable.value,
                                            admin : inputAdmin.value

                                        })


                                        var user_ref = database.ref('number'+ "")
                                        user_ref.once("value", function(snapshot) {
                                        var data = snapshot.val();
                                        console.log(data);

                                        database.ref('/'+'').update({
                                            number : data+1
                                        });
                                        console.log(data)
                                        database.ref('id/' + '').update({
                                            [data] : inputID.value
                                        })
                                      })


                                      submit.innerHTML='-  Done  -'
                                      setTimeout(() => {
                                        submit.innerHTML='-  Add  -'
                                        window.location.reload()
                                      }, 1000);

                                      
                                    }
                                    var time=document.createElement('span')
                                    setInterval(() => {
                                        time.innerHTML="<p/>"+Date.now()
                                    }, 1000);
                                    
                                    settingsDiv.appendChild(time)

                                    var timebtn=document.createElement('button')
                                        timebtn.innerHTML="Copy"
                                    
                                    settingsDiv.appendChild(timebtn)
                                    timebtn.onclick=function(){
                                        navigator.clipboard.writeText(Date.now());
                                    }

                                }else if(dropdown.value=='-------'){}else{
                                
                                    //admin chose existing user

                                    var user_ref = database.ref('users'+ "/" + [dropdown.value])
                                    user_ref.once("value", function(snapshot) {
                                    var data = snapshot.val();
                                    console.log(data.name);


                                    var header=document.createElement('span')
                                    header.innerHTML='Existing user editor'
                                    settingsDiv.appendChild(header)
                                    var inputName=document.createElement('input')
                                    inputName.placeholder='User name'
                                    inputName.value=data.name;
                                    settingsDiv.appendChild(inputName)

                                    var inputSuspension=document.createElement('input')
                                    inputSuspension.placeholder='Suspension time'
                                    inputSuspension.value=data.suspended;
                                    settingsDiv.appendChild(inputSuspension)
                                    
                                    var inputClaimable=document.createElement('input')
                                    inputClaimable.placeholder='User claimable'
                                    inputClaimable.value=data.claimable;
                                    settingsDiv.appendChild(inputClaimable)

                                    var inputAdmin=document.createElement('input')
                                    inputAdmin.placeholder='User admin'
                                    inputAdmin.value=data.admin;
                                    settingsDiv.appendChild(inputAdmin)

                                    var submit=document.createElement('button')
                                    submit.innerHTML='Change'
                                    settingsDiv.appendChild(submit)
                                    submit.onclick=function(){
                                        database.ref('users/' + dropdown.value).set({
                                            name : inputName.value,
                                            suspended : inputSuspension.value,
                                            claimable : inputClaimable.value,
                                            admin : inputAdmin.value
                                        })
                                        submit.innerHTML='done';
                                        setTimeout(() => {
                                            submit.innerHTML='Change'
                                        }, 1000);
                                    }
                                                                        var time=document.createElement('span')
                                    setInterval(() => {
                                        time.innerHTML="<p/>"+Date.now()
                                    }, 1000);
                                    
                                    settingsDiv.appendChild(time)

                                    var timebtn=document.createElement('button')
                                        timebtn.innerHTML="Copy"
                                    
                                    settingsDiv.appendChild(timebtn)
                                    timebtn.onclick=function(){
                                        navigator.clipboard.writeText(Date.now());
                                    }
                                })




                                }
                                oldval=dropdown.value
                            }
                        }, 1);







                        }
                        //remove later

                        
                    }

                }else{
                    document.getElementById('deviceValidationtxt').innerHTML='denied'
                }
            })
    }
