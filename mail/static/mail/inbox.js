document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  

  // By default, load the inbox
  load_mailbox('inbox');
});


function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#single-emails-view').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

  document.querySelector('form').onsubmit = function() {
    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
          recipients: document.querySelector('#compose-recipients').value,
          subject: document.querySelector('#compose-subject').value,
          body: document.querySelector('#compose-body').value
      })
    })
    .then(response => response.json())
    .then(() => {
      load_mailbox('send')
    })
  
  }
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#single-emails-view').style.display = 'none';


  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    //emails is an arrany of email objects

    emails.forEach(current => {
      const subject = current.subject
      const id = current.id
      const sender = current.sender
      const timestamp = current.timestamp
      const read = current.read

      
      const email = document.createElement('div')
      email.className = 'email'
      if(!read){
        email.style.backgroundColor ='#bed9e2'
      }
      email.addEventListener('click', function(){
        emailView(id)
      }) 
      email.innerHTML = `<strong>${sender}</strong>  ${subject}     <scan class='time'>${timestamp}</scan>` 
      document.querySelector('#emails-view').append(email)
    })
    
  })

}


function emailView(id){
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#single-emails-view').style.display = 'block';
  

  try {
    document.querySelector('.email_view_container').remove();  
  } catch (error) {
    
  }
  

  fetch(`/emails/${id}`)
    .then(response => response.json())
    .then(email => {
      
      const id = email.id
      const subject = email.subject
      const sender = email.sender
      const recipients = email.recipients
      const body = email.body
      const timestamp = email.timestamp

      const archived = email.archived


      const prop = document.createElement('div')
      prop.className = 'email_view_container'
      fetch(`/emails/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
            read: true
        })
      })

      //email infos
      const from = document.createElement('p')
      from.innerHTML = `<strong>FROM: </strong>${sender}`
      from.className = 'info'
      const to = document.createElement('p')
      to.innerHTML = `<strong>TO: </strong>${recipients}`
      to.className = 'info'
      const sub = document.createElement('p')
      sub.innerHTML = `<strong>SUBJECT: </strong>${subject}`
      sub.className = 'info'
      const time = document.createElement('p')
      time.innerHTML = `<strong>TIMESTAMP: </strong>${timestamp}`
      time.className = 'info'
      
      //reply button
      const reply = document.createElement('button')
      reply.innerHTML = 'Reply'
      reply.className = "btn btn-sm btn-outline-primary"
      reply.addEventListener('click', function(){
        handleReply(recipients, subject, timestamp, sender, body)
      }) 

      //archive button
      const arch = document.createElement('button')
      arch.className = "btn btn-sm btn-outline-primary"

      if(archived === false){
        arch.innerHTML = 'Archive'
      } else {
        arch.innerHTML = 'Unarchive'
      }
      arch.addEventListener('click', async function(){
        await handleArchive(id);
        load_mailbox('inbox')
      }) 
      
      const hr = document.createElement('hr')
      
      const bod = document.createElement('p')
      bod.innerHTML = `${body}`


      emailInMailbox(id, 'sent').then(result => {
        console.log(result)
        if (result === true){
          prop.append(from, to, sub, time, reply, hr, bod)        
        } else {
          prop.append(from, to, sub, time, reply, arch, hr, bod)
        }
      }) 

      document.querySelector('#single-emails-view').append(prop)
    
  });
}


//helper functions
async function emailInMailbox(id, mailbox){

  const response = await fetch(`/emails/${mailbox}`)
  const emails = await response.json()

  let ok;
  emails.forEach(element => {
    const idSent = element.id
    if(id === idSent){
      ok = 1
    }
  })

  if(ok === 1){
    return true
  }
  

  // return fetch(`/emails/${mailbox}`)
  
  //   .then(response => response.json())
  //   .then(emails => {
  //     //emails is an arrany of email objects
  //     emails.forEach(element => {
  //       const idSent = element.id
  //       if(id === idSent){
  //         console.log('id is equal do idsetn')
  //         return true
  //       }
  //     })
  //   })
   
}

function handleReply(recipients, subject, timestamp, sender, body){
  compose_email();

  document.querySelector('#compose-recipients').value = recipients;
  //if subject not begins with re...
  document.querySelector('#compose-subject').value = `Re: ${subject}` ;
  document.querySelector('#compose-body').value = `On ${timestamp}, ${sender} wrote: ${body}` ;
}

async function isArchive(id){
  const response = await fetch(`/emails/${id}`);
  const email = await response.json();
  const arc = email.archived;
  if (arc === true) {
    return true;
  }
  else {
    return false;
  }
}

async function handleArchive(id){
  const response = await isArchive(id)

  if(response === true){
    await fetch(`/emails/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
          archived: false
      })
    })
  } else {
    await fetch(`/emails/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
          archived: true
      })
    })
  }


}