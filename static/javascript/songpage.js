const switcherSpeed = 750
const bezierCurve = "cubic-bezier(.21,.9,.57,1)"

function switchImageAnimations(direction, newImage, newCaption) {
    var currentLeftCycleImage = document.getElementById("leftCycleImage")
    var currentImage = document.getElementById("currentImage")
    var currentRightCycleImage = document.getElementById("rightCycleImage")
    var currentCaption = document.getElementById("caption")

    currentCaption.style.animation = `captionFade ${switcherSpeed}ms linear`
    if (direction == -1) {
        currentLeftCycleImage.style.animation = `switchLeft0 ${switcherSpeed}ms ${bezierCurve} forwards`
        currentImage.style.animation = `switchLeft1 ${switcherSpeed}ms ${bezierCurve} forwards`
        currentRightCycleImage.style.animation = `leftRight ${switcherSpeed}ms ${bezierCurve} forwards`
        delay(switcherSpeed/2).then(function() {
            currentRightCycleImage.src = newImage
            currentCaption.innerText = newCaption
        })
    } else if (direction == 1) {
        currentLeftCycleImage.style.animation = `rightLeft ${switcherSpeed}ms ${bezierCurve} forwards`
        currentImage.style.animation = `switchRight1 ${switcherSpeed}ms ${bezierCurve} forwards`
        currentRightCycleImage.style.animation = `switchRight2 ${switcherSpeed}ms ${bezierCurve} forwards`
        delay(switcherSpeed/2).then(function() {
            currentLeftCycleImage.src = newImage
            currentCaption.innerText = newCaption
        })
    }

    delay(switcherSpeed).then(function() {
        currentLeftCycleImage.style.animation = ""
        currentImage.style.animation = ""
        currentRightCycleImage.style.animation = ""
        currentCaption.style.animation = ""
    })
}

function switchImage(direction) {
    document.getElementById("switcherButtonLeft").disabled = true;
    document.getElementById("switcherButtonRight").disabled = true;

    var images = []
    var captions = []
    for (let i = 0; i < imgs.length; i++) {
        images.push(imgs[i]["filename"])
        captions.push(imgs[i]["caption"])
    };
    var currentImageFilename = document.getElementById("currentImage").alt
    var currentImageIndex = images.indexOf(currentImageFilename)
    var newIndex = currentImageIndex + direction
    var indexs = [newIndex - 1, newIndex, newIndex + 1]
    for (let i = 0; i < indexs.length; i++) {
        var currentIndex = indexs[i]
        if (currentIndex < 0) {
            currentIndex += images.length
        } else if (currentIndex >= images.length) {
            currentIndex -= images.length
        }
        indexs[i] = currentIndex
    }
    const url = "../static/images/"
    if (direction == -1) {
        switchImageAnimations(direction, url.concat(encodeURIComponent(images[indexs[0]])), captions[indexs[1]])
    } else if (direction == 1) {
        switchImageAnimations(direction, url.concat(encodeURIComponent(images[indexs[2]])), captions[indexs[1]])
    }
    delay(switcherSpeed).then(function() {
        document.getElementById("currentImage").src = url.concat(encodeURIComponent(images[indexs[1]]))
        document.getElementById("currentImage").alt = images[indexs[1]]
        document.getElementById("leftCycleImage").src = url.concat(encodeURIComponent(images[indexs[0]]))
        document.getElementById("rightCycleImage").src = url.concat(encodeURIComponent(images[indexs[2]]))
        document.getElementById("switcherButtonLeft").disabled = false;
        document.getElementById("switcherButtonRight").disabled = false;
    })
}

function delay(time) {
    return new Promise(resolve => setTimeout(resolve, time));
}