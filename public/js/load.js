const C = document.getElementById("canvas");
const c = C.getContext("2d");

const images = {};

function loadImages(links){
  return new Promise((resolve, reject) => {
    var loadedNum = 0;
    links.forEach(img => {
      let image = new Image();
      image.src = img.url;
      images[img.name] = image;
      let e = []
      image.onload = () => {
        loadedNum += 1;
        if(loadedNum >= links.length){
          console.log("loaded");
          resolve();
        }
      }
    });
  });
}

function addImage(name, x, y){
  c.drawImage(images[name], x, y)
}