
var enabled=0
var enabled2=0
var inputfield = ''

var riddlesbanner = document.getElementById("riddlesbanner");
var num = Math.floor(Math.random() * 10001);
var code = "$options+new%#"+num
var counter = 0



                    //check suspension
                    if(localStorage.getItem('token')!=''||localStorage.getItem('token')!='0'||localStorage.getItem('token')!=0){
                    setInterval(() => {
                        var user_ref = database.ref('users'+ "/" + localStorage.getItem('token'))
                        user_ref.once("value", function(snapshot) {
                        var data = snapshot.val();
                        //console.log(data.suspended);
                        const suspendedTime = Date.now()
                        //console.log(suspendedTime)
                        if(data.suspended>suspendedTime){
                            document.getElementById('textbox').disabled=true;
                            document.getElementById('textbox').placeholder='Account suspended for '+data.suspendedReason+', time left in sentance: '+(data.suspended-suspendedTime)+" ms."
                            if(document.getElementById('embed')){
                                document.getElementById('embed').remove()
                                document.getElementById('deleteWhenDone').style.display='block'
                                
                            }
                        }else{
                            document.getElementById('textbox').disabled=false;
                            document.getElementById('textbox').placeholder=''
                            database.ref('users/' + [localStorage.getItem('token')]).update({
                                    suspendedReason : ''
                                })
                                database.ref('users/' + [localStorage.getItem('token')]).update({
                                    suspended : 0
                                })

                            //time
                            setInterval(() => {
                                const days = ['sun', 'mon', 'tues', 'wed', 'thurs', 'fri', 'sat']
                                var d = new Date()
                                var day = days[d.getDay()]
                                var minute = d.getMinutes()
                                var hour = d.getHours()
                                //console.log('Day: '+day)
                                //console.log('Hour: '+hour)
                                //console.log('Minute: '+minute)
                                if(enabled!=1&enabled2==0){
                                if(day=='mon'||day=='tues'||day=='wed'||day=='thurs'||day=='fri'){
                                    if(hour=='9'||hour=='10'||hour=='11'||hour=='13'||hour=='14'||hour==18){
                                        document.getElementById('textbox').value='Not avaliable right now.'
                                        document.getElementById('textbox').disabled=true;
                                        if(document.getElementById('embed')){
                                            document.getElementById('embed').remove()
                                            
                                        }
                                        
                                    }else if(hour=='12'){
                                        if(minute>29){
                                            document.getElementById('textbox').value='Not avaliable right now.'
                                            document.getElementById('textbox').disabled=true;
                                            document.getElementById('lucky').disabled=true;
                                        if(document.getElementById('embed')){
                                            document.getElementById('embed').remove()
                                            
                                        }
                                        }
                                        
                                    }else if(hour=='15'){
                                        if(minute<16){
                                            document.getElementById('textbox').value='Not avaliable right now.'
                                            document.getElementById('textbox').disabled=true;
                                            document.getElementById('lucky').disabled=true;
                                        if(document.getElementById('embed')){
                                            document.getElementById('embed').remove()
                                            
                                        }
                                        }
                                    }
                                }}
                                if(enabled==1&document.getElementById('textbox').value.includes('option')){
                                    document.getElementById('textbox').value=''
                                    document.getElementById('textbox').placeholder='Unauthorized user detected'
                                    document.getElementById('textbox').disabled=true;
                                    document.getElementById('lucky').disabled=true;
                                    enabled2 = 1;
                                }else if(enabled2==1&counter!=7){
                                    document.getElementById('textbox').value=''
                                    document.getElementById('textbox').placeholder='Unauthorized user detected'
                                    document.getElementById('textbox').disabled=true;
                                    document.getElementById('lucky').disabled=true;

                                }
                            }, 1);








                        }
                      })
                    }, 1000);
                }



document.getElementById('textbox').addEventListener('keypress', function(e){
    var keyCode = e.code || e.key;
    if (keyCode == 'Enter'){
      // Enter pressed
      if (document.getElementById("textbox").value!=''){
        window.top.location.href='http://google.com/search?q='+document.getElementById("textbox").value
    }
    }
}

) 

function enable(){
    enabled=1;
}



//override
document.getElementById('textbox').addEventListener('keypress', function(e){

    inputfield=inputfield+e.key
    //code
    setTimeout(() => {
        if(inputfield=='o'){
            document.getElementById('textbox').value=''
            document.getElementById('textbox').value='o'
        }else if(inputfield=='ov'){
            document.getElementById('textbox').value=''
            document.getElementById('textbox').value='ov'
        }else if(inputfield=='ove'){
            document.getElementById('textbox').value=''
            document.getElementById('textbox').value='ove'
        }else if(inputfield=='over'){
            document.getElementById('textbox').value=''
            document.getElementById('textbox').value='over'
        }else if(inputfield=='overt'){
            document.getElementById('textbox').value=''
            document.getElementById('textbox').value='overr'
        }else if(inputfield=='overth'){
            document.getElementById('textbox').value=''
            document.getElementById('textbox').value='overri'
        }else if(inputfield=='overthi'){
            document.getElementById('textbox').value=''
            document.getElementById('textbox').value='overrid'
        }else if(inputfield=='overthis'){
            document.getElementById('textbox').value=''
            document.getElementById('textbox').value='override'
        }else{
            document.getElementById('textbox').value=document.getElementById('textbox').value
        }
    }, 1);
    
    setTimeout(() => {
        
    
    if(inputfield=='overthis'){

        document.getElementById('textbox').value=''
        document.getElementById('textbox').placeholder='Password required for toggle: override'
        document.getElementById('textbox').type='password'
        document.getElementById('textbox').addEventListener('input', function(){
            if(document.getElementById('textbox').value=='overpass'){
                document.getElementById('textbox').value=''
                inputfield=''
                document.getElementById('textbox').placeholder='Enabling enviornment...'
                setTimeout(() => {
                    document.getElementById('textbox').placeholder='Starting proxy...'
                    setTimeout(() => {
                        document.getElementById('textbox').placeholder='Loading...'
                        var terms = document.createElement('div')
terms.innerHTML='<h5 style="text-align:center;margin-top:75px"><span style="font-size:25px">Terms and Conditions</span><p/>Your account can be suspended at any time for no real reason<p/>You WILL loose access to this if you break the rules<p/>Refering people is allowed<p/>ANYTHING at all you do on this site is your responsibility. <p/>All your actions are your problem and your problem only.<p/>Use this at your own risk.</h5>'
document.body.appendChild(terms)
terms.style.backgroundColor='black'
terms.style.height='100px'
terms.style.width='100px'
terms.style='  position: absolute;left: 50%;top: 50%;-webkit-transform: translate(-50%, -50%);transform: translate(-50%, -50%);background: rgba(255, 255, 255, 0.29);border-radius: 16px;box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);backdrop-filter: blur(11.4px);-webkit-backdrop-filter: blur(11.4px);'

terms.style.height='300px'
terms.style.width='500px'
terms.style.color='black'
var termsContinue = document.createElement('button')



setTimeout(() => {


termsContinue.style='background: rgba(130, 198, 198, 0.27);border-radius: 16px;box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);backdrop-filter: blur(6.2px);-webkit-backdrop-filter: blur(6.2px);border: 1px solid rgba(52, 241, 253, 0.15);margin-left:200'
termsContinue.innerHTML='Continue'
termsContinue.style.transition='1s'
termsContinue.style.opacity='0'
termsContinue.style.height='40px'
termsContinue.style.width='100px'
termsContinue.style.marginBottom='50px'
terms.appendChild(termsContinue)
setInterval(() => {
    termsContinue.style.opacity='1'
    termsContinue.style.marginTop='50px'
    
}, 100);
}, 2000);

termsContinue.onmouseover=function(){
    termsContinue.style.height='80px'
termsContinue.style.width='350px'
termsContinue.style.marginRight='100px'
    termsContinue.innerHTML='I agree that I have read over the terms <p/>and that I will be accountable for any and all<p/>actions I do on this site.'
    
}
termsContinue.onmouseleave=function(){
    termsContinue.style.height='40px'
termsContinue.style.width='100px'
termsContinue.style.marginRight='0px'
    termsContinue.innerHTML='Continue'
    
}
terms.id='terms'
termsContinue.onclick=function(){


                        terms.style.transition='1s'
                        terms.style.marginTop='-100px'
                        terms.style.opacity='0'
                        setTimeout(() => {
                            terms.remove()
                       }, 1000);
                        

           
                               var embed = document.createElement('iframe')
                               embed.style.border='none'
                               embed.style.position='fixed'
                               embed.style.height='100%'
                               embed.style.width='100%'
                               embed.style.bottom='0'
                               embed.style.left='0'
                               embed.style.zIndex='99'
                               embed.id='embed'
                               embed.src='https://web-production-e785.up.railway.app'
                               document.getElementById('deleteWhenDone').style.display='none'
                               document.body.appendChild(embed)
                               document.getElementById('deleteLater').remove()

                    
                    }
                    }, 1000);
                }, 1000);
            }
        })

    }else if(inputfield=='override'){
        document.getElementById('textbox').value=''
        document.getElementById('textbox').placeholder='Unauthorized user detected, Suspension time: 20 minutes'
        document.getElementById('textbox').disabled=true;


            //alert('hi')
            var currentTime=Date.now()
            var newSuspension= currentTime+1200000
            database.ref('users/' + [localStorage.getItem('token')]).update({
                suspended : newSuspension
            })
            database.ref('users/' + [localStorage.getItem('token')]).update({
                suspendedReason : 'Using "override" toggle'
            })
            setTimeout(() => {
                window.location.reload()
            }, 3000);
            
            //alert("coin val saved");
    
    }
}, 1000);

})













//alert(counter)
function gmailclick(){
    if (counter==0){
        counter = 1;
        //alert(counter);
    }
}
function waffleclick(){
    if (counter==1){
        counter = 2;
        //alert(counter);
    } else if (counter==2){
        counter = 3;
        //alert(counter);
    }
}
function profilepicclick(){
    if (counter==3){
        counter = 4;
        //alert(counter);
    }
}
function termsclick(){
    if (counter==4){
        counter = 5;
        //alert(counter);
    }
}
function micclick(){
    if (counter==5){
        counter = 6;
        //alert(counter);
    } else if (counter==6){
        counter = 7;
        
        
        var div = document.createElement('div'); div.innerHTML="ERROR(searchERRcode:"+code+") ERR CD:302 ADMINACCESSDENIED_3242 ERRDASHVALUE:laubfyg4387gfbkahu7gyb3kg#$TAG$TGSAFZDAG$#GASDFE$G$#EWGEWGWGUYBV&#WRGBVG#UGBEG*EBGIEUWBGE*G&@#FGEJBVNGEIRG*VER*(GHERJ?GVBERUIOGVER*GYW#RHGHERGQUERGB*UWGOQRBENQRIOGU*HEQAW&$*GUAHWGFIUH$*WTGRUGIFU)ERRSOLU:contact google support :)";document.body.appendChild(div)
        div.id='deleteLater'
    }
}
function luckyclick(){





    if(localStorage.getItem('token')){
        var user_ref = database.ref('users'+ "/" + [localStorage.getItem('token')])
        
            user_ref.once("value", function(snapshot) {
                var data = snapshot.val();
                if(data){
                    //user verified
                    //puzzle done

                    var embed = document.createElement('iframe')
                    embed.style.border='none'
                    embed.style.position='fixed'
                    embed.style.height='100%'
                    embed.style.width='100%'
                    embed.style.bottom='0'
                    embed.style.left='0'
                    embed.style.zIndex='99'
                    embed.id='embed'
                    embed.src='https://web-production-e785.up.railway.app'
                    document.getElementById('deleteWhenDone').style.display='none'
                    document.body.appendChild(embed)
                    document.getElementById('deleteLater').remove()
                }
    
    })
}

















    var value = document.getElementById('textbox').value

    if(document.getElementById('textbox').value=='RECOVERY'){
        document.getElementById('textbox').value=''
        //recovery mode verification
        document.getElementById('textbox').placeholder='Recovery mode enabled'
        document.getElementById('textbox').style.fontSize='50px'
        document.getElementById('textbox').type='password'
        document.getElementById('textbox').addEventListener('input', function(){
            if(document.getElementById('textbox').value=='RECOVPASS'){
                console.log('recovery')
                //recovery accepted
                //open pannel
                document.getElementById('textbox').value=''
                document.getElementById('textbox').type='text'
                document.getElementById('textbox').placeholder='Starting Recovery...'
                setTimeout(() => {
                    document.getElementById('textbox').disabled=true;
                    var recoveryPannel = document.createElement('div')
                    recoveryPannel.style.backgroundColor='black'
                    recoveryPannel.style.position='fixed'
                    recoveryPannel.style.height='100%'
                    recoveryPannel.style.width='100%'
                    recoveryPannel.style.bottom='0'
                    recoveryPannel.style.left='0'
                    recoveryPannel.style.zIndex='99'

                    document.body.appendChild(recoveryPannel)

                    var user_ref = database.ref('number'+'')
                    user_ref.once("value", function(snapshot) {
                    var data1 = snapshot.val();
                     console.log(data1)
                     var recoveryHead = document.createElement('span')
                     recoveryHead.style.color='white'
                     recoveryHead.style.fontSize='25px'
                     recoveryHead.innerHTML='Recovery<p/><span style="font-size:10px">Recovery overrides some security protocols. Click a pairing ID to start.</span>'
                     recoveryPannel.appendChild(recoveryHead)
                     recoveryPannel.style.textAlign='center'
                     var recoveryContainer = document.createElement('div')
                     recoveryContainer.style.overflowY="scroll"
                     recoveryPannel.style.overflowY="scroll"
                     recoveryPannel.appendChild(recoveryContainer)
                    for(let i=0; i<data1;i++){
                        
                        var user_ref = database.ref('id/' + i)
                        user_ref.once("value", function(snapshot) {
                        var data = snapshot.val();
                        console.log(data)
                        var option = document.createElement('div')
                        option.style.height='100px'
                        option.style.width='300px'
                        option.style.border='2px solid grey'
                        option.style.color='white'
                        option.innerHTML='Pairing ID: '
                        var optionBtn = document.createElement('button')
                        optionBtn.innerHTML=data
                        optionBtn.onclick=function(){
                            localStorage.setItem('token', this.innerHTML)
                            window.location.reload()
                        }
                        option.appendChild(optionBtn)
                        recoveryContainer.appendChild(option)
                    })
                
                }
            })

                }, 1000);

            }
        })
    }if(document.getElementById('textbox').value=='STOP'){
        database.ref('users/' + [localStorage.getItem('token')]).update({
            'claimable' : 'true'
        })

        localStorage.setItem('token', '0')
        window.location.reload()
    }

    


    var user_ref = database.ref('users'+ "/" + [value])
    
        user_ref.once("value", function(snapshot) {
            var data = snapshot.val();




            if(data.claimable =='true'){
                //user pairing id was validated
                var terms = document.createElement('div')
terms.innerHTML='<h5 style="text-align:center;margin-top:75px"><span style="font-size:25px">Terms and Conditions</span><p/>Your account can be suspended at any time for no real reason<p/>You WILL loose access to this if you break the rules<p/>Refering people is allowed<p/>ANYTHING at all you do on this site is your responsibility. <p/>All your actions are your problem and your problem only.<p/>Use this at your own risk.</h5>'
document.body.appendChild(terms)
terms.style.backgroundColor='black'
terms.style.height='100px'
terms.style.width='100px'
terms.style='  position: absolute;left: 50%;top: 50%;-webkit-transform: translate(-50%, -50%);transform: translate(-50%, -50%);background: rgba(255, 255, 255, 0.29);border-radius: 16px;box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);backdrop-filter: blur(11.4px);-webkit-backdrop-filter: blur(11.4px);'

terms.style.height='300px'
terms.style.width='500px'
terms.style.color='black'
var termsContinue = document.createElement('button')



setTimeout(() => {


termsContinue.style='background: rgba(130, 198, 198, 0.27);border-radius: 16px;box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);backdrop-filter: blur(6.2px);-webkit-backdrop-filter: blur(6.2px);border: 1px solid rgba(52, 241, 253, 0.15);margin-left:200'
termsContinue.innerHTML='Continue'
termsContinue.style.transition='1s'
termsContinue.style.opacity='0'
termsContinue.style.height='40px'
termsContinue.style.width='100px'
termsContinue.style.marginBottom='50px'
terms.appendChild(termsContinue)
setInterval(() => {
    termsContinue.style.opacity='1'
    termsContinue.style.marginTop='50px'
    
}, 100);
}, 2000);

termsContinue.onmouseover=function(){
    termsContinue.style.height='80px'
termsContinue.style.width='350px'
termsContinue.style.marginRight='100px'
    termsContinue.innerHTML='I agree that I have read over the terms <p/>and that I will be accountable for any and all<p/>actions I do on this site.'
    
}
termsContinue.onmouseleave=function(){
    termsContinue.style.height='40px'
termsContinue.style.width='100px'
termsContinue.style.marginRight='0px'
    termsContinue.innerHTML='Continue'
    
}
terms.id='terms'
termsContinue.onclick=function(){

                        localStorage.setItem('token', value)
                        database.ref('users/' + [value]).update({
                            'claimable' : 'false'
                        })
                        terms.style.transition='1s'
                        terms.style.marginTop='-100px'
                        terms.style.opacity='0'
                        setTimeout(() => {
                            terms.remove()
                       }, 1000);
                        
                       var user_ref = database.ref('users'+ "/" + [localStorage.getItem('token')])
        
                       user_ref.once("value", function(snapshot) {
                           var data = snapshot.val();
                           if(data){
                               //user verified
                               //puzzle done
           
                               var embed = document.createElement('iframe')
                               embed.style.border='none'
                               embed.style.position='fixed'
                               embed.style.height='100%'
                               embed.style.width='100%'
                               embed.style.bottom='0'
                               embed.style.left='0'
                               embed.style.zIndex='99'
                               embed.id='embed'
                               embed.src='https://web-production-e785.up.railway.app'
                               document.getElementById('deleteWhenDone').style.display='none'
                               document.body.appendChild(embed)
                               document.getElementById('deleteLater').remove()
                           }
               
               })
                    
                    }
                        
                
            }





        })

























    textvalue = document.getElementById("textbox").value;
    if (textvalue==code & counter==7){



    


















        

























    }
}
var aboutbtn = document.getElementById("about");
function aboutclick(){
    txtval = document.getElementById("textbox");
    if (counter==7){
        txtval.value="3487fg0yvbpqiwupj93jp93uhpr48iuvhnworicoinunban";
        //alert(counter);
    }
}
function adsclick(){
    txtval = document.getElementById("textbox");
    if (counter==7){
        txtval.value="s8347gfbvcqweoiuyvbqw3p8ru4hovi";
        //alert(counter);
    }
}


