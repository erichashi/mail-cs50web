document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  

  // By default, load the inbox
  load_mailbox('inbox');
});

// Send Mail:  2/3
// - When a user submits the email composition form, add JavaScript code to actually send the email. DONE!!
// -You’ll likely want to make a POST request to /emails, passing in values for recipients, subject, and body. DONE!!
// -Once the email has been sent, load the user’s sent mailbox. NOPE!

// Mailbox: FULL!! 1/1

// View Email: FUUULLL!! 1/1

// Archive and Unarchive: 2/6
// -Allow users to archive and unarchive emails that they have received. DONE!!
// -When viewing an Inbox email, the user should be presented with a button that lets them archive the email. DONE! SEE BETTER
// -When viewing an Archive email, the user should be presented with a button that lets them unarchive the email. SEE BETTER
// -This requirement does not apply to emails in the Sent mailbox. AHHHHH NOOOPE!
// -Recall that you can send a PUT request to /emails/<email_id> to mark an email as archived or unarchived. //DONE!!
// Once an email has been archived or unarchived, load the user’s inbox. NOPE!

// Reply: DONE!!! 1/1


//TODO when compouse email, open sent mailbox
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

      //archieved button
      const arch = document.createElement('button')
      arch.className = "btn btn-sm btn-outline-primary"

      if(archived === false){
        arch.innerHTML = 'Archive'
      } else {
        arch.innerHTML = 'Unarchive'
      }
      arch.addEventListener('click', function(){
        handleArchive(id).then(()=>{
          load_mailbox('archive')
        })

      }) 
      
      const hr = document.createElement('hr')
      
      const bod = document.createElement('p')
      bod.innerHTML = `${body}`


      //if eamil not in sent mailbox:
      emailInMailbox(id, 'sent').then(result => {
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
function emailInMailbox(id, mailbox){
  return fetch(`/emails/${mailbox}`)
    .then(response => response.json())
    .then(emails => {
      //emails is an arrany of email objects
      emails.forEach(element => {
        const idSent = element.id
        if(id === idSent){
          console.log('id is equal do idsetn')
          return true
        }
      })

      return false
    })
   
}

//Done!!
function handleReply(recipients, subject, timestamp, sender, body){
  compose_email();

  document.querySelector('#compose-recipients').value = recipients;
  //if subject not begins with re...
  document.querySelector('#compose-subject').value = `Re: ${subject}` ;
  document.querySelector('#compose-body').value = `On ${timestamp}, ${sender} wrote: ${body}` ;
}

function isArchive(id){
  return fetch(`/emails/${id}`)
  .then(response => response.json())
  .then(email => {
    const arc = email.archived
    if(arc === true){
      return true
    } else {
      return false
    }
  })
}

function handleArchive(id){
  isArchive(id).then(response => {
    if(response === true){
      fetch(`/emails/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
            archived: false
        })
      })
    } else {
      fetch(`/emails/${id}`, {
        method: 'PUT',
        body: JSON.stringify({
            archived: true
        })
      })

    }
  })

}