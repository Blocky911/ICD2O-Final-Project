const spikeRects = document.querySelectorAll(".spike");

function checkSpikeCollision(playerRect){

    spikeRects.forEach(spike=>{

        const rect = spike.getBoundingClientRect();

        if(
            playerRect.left < rect.right &&
            playerRect.right > rect.left &&
            playerRect.top < rect.bottom &&
            playerRect.bottom > rect.top
        ){
            playerHealth -= 10;
        }

    });

}for(let i=0;i<2500;i+=100){

    createTree(i,0);
    createTree(i,2430);

    createTree(0,i);
    createTree(2430,i);

}const obstacles = [
    house,
    pool,
    ...trees,
    ...rocks
];

function canMove(newX,newY){

    const playerBox = {
        left:newX,
        top:newY,
        right:newX+40,
        bottom:newY+80
    };

    for(let obj of obstacles){

        const rect = obj.getBoundingClientRect();

        if(
            playerBox.left < rect.right &&
            playerBox.right > rect.left &&
            playerBox.top < rect.bottom &&
            playerBox.bottom > rect.top
        ){
            return false;
        }
    }

    return true;
}