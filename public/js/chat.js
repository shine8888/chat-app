const socket = io();

// Elements
const $messageForm = document.querySelector("#message-form");
const $messageFormInput = $messageForm.querySelector("input");
const $messageFormButton = $messageForm.querySelector("button");
const $sendLocationButton = document.querySelector("#sendLocation");
const $messages = document.querySelector("#messages");

// Templates
const messageTemplate = document.querySelector("#message-template").innerHTML;
const locationTemplate = document.querySelector("#location-template").innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// Options
const { username, room } = Qs.parse(location.search, {
    ignoreQueryPrefix: true,
});


// Autoscrolling

const autoscroll = () => {

    // New message element
    const $newMessage = $messages.lastElementChild

    // Height of the new message
    const newMessageStyle = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyle.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible height
    const visibleHeight = $messages.offsetHeight

    // Height of messages container
    const containerHeight = $messages.scrollHeight

    // How far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}


socket.on("locationMessage", (location) => {
    console.log(location);
    const html = Mustache.render(locationTemplate, {
        location: location.text,
        createdAt: moment(location.createdAt).format("HH:mm:ss"),
        username: location.username
    });
    $messages.insertAdjacentHTML("beforeend", html);
    autoscroll()
});

socket.on("message", (message) => {
    console.log(message);
    const html = Mustache.render(messageTemplate, {
        message: message.text,
        createdAt: moment(message.createdAt).format("HH:mm:ss a"),
        username: message.username
    });
    $messages.insertAdjacentHTML("beforeend", html);
    autoscroll()
});

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector('#sidebar').innerHTML = html
})


// server (emit) -> client (recieve) -- acknowledgement --> server

// client (emit) -> server )recieve -- acknowledgement --> client

$messageForm.addEventListener("submit", (e) => {
    e.preventDefault();

    // disable the form
    $messageFormButton.setAttribute("disabled", "disabled");

    const txt = e.target.elements.inputText.value;
    // const txt = document.querySelector("input").value;
    socket.emit("sendMessage", txt, (error) => {
        // enable
        $messageFormButton.removeAttribute("disabled");
        $messageFormInput.value = "";
        $messageFormInput.focus();
        if (error) {
            return console.log(error);
        }
        console.log("Message deliveried");
    });
});

$sendLocationButton.addEventListener("click", () => {
    if (!navigator.geolocation) {
        return alert("This browser does not support Geolocation");
    }

    $sendLocationButton.setAttribute("disabled", "disabled");

    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit(
            "sendLocation", {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
            },
            (error) => {
                if (error) {
                    return console.log(error);
                }
                $sendLocationButton.removeAttribute("disabled");
                console.log("Location shared");
            }
        );
    });
});

socket.emit("join", { username, room }, (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }
});