function playSound() {
    var audio = document.getElementById("myAudio");
    //audio.load();
    audio.currentTime = 0;
    audio.play();
}

function disabilitaButton() {
    BtnOpenCloseModel.disabled = true;
  }
  
  function riabilitaButton() {
    BtnOpenCloseModel.disabled = false;
  }

export { playSound }