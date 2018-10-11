document.addEventListener("DOMContentLoaded", event=> {
    const app = firebase.app();
    const db = firebase.firestore();
    const myPost = db.collection.('Axon').doc('test1');
    myPost.get()
        .then(doc => {
            const data = doc.data();
            document.write(data.tite + '<br>')
            document.write( data.createdAt + '<br>')
        })
});


function googleLogin(){
    const provider = new firebase.auth.GoogleAuthProvider();
    firebase.auth().signInWithPopup(provider)

    .then(result => {
        const user = result.user;
        document.write('Hello ${user.displayName}');
        console.log(user)
    })
    .catch(console.log)
}