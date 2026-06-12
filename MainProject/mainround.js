const map = document.getElementById("map");
const treeContainer = document.getElementById("treeContainer");

/* Border Trees */

for(let i = 0; i < 2500; i += 100){

    createTree(i,0);
    createTree(i,2430);

    createTree(0,i);
    createTree(2430,i);
}

function createTree(x,y){

    const tree = document.createElement("div");

    tree.className = "tree";

    tree.style.left = x + "px";
    tree.style.top = y + "px";

    treeContainer.appendChild(tree);
}