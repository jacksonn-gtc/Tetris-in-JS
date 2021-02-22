
// Class to define a single square in the gamespace
// Contains a color value, a 'state' value, and (?)rotation
// States = { 0, 1, 2 };
//      0 -> no block
//      1 -> moving block (player controlled)
//      2 -> non-moving block
// (?) rotation, still unsure
class Tile {
    constructor(state, color, rowRotateOffset, colRotateOffset, rotationType) {
        this.state = state;
        this.color = color;

        this.rowRotateOffset = rowRotateOffset;
        this.colRotateOffset = colRotateOffset;
        this.rotationType = rotationType;
    }

    get getState() {
        return this.state;
    }

    set setState(state) {
        this.state = state;
    }

    // This block's RGBA color array
    get getColor() {
        return this.color;
    }

    set setColor(color){
        this.color = color;
    }

    get getRowRotateOffset() {
        return this.rowRotateOffset;
    }

    set setRowRotateOffset(rowRotateOffset) {
        this.rowRotateOffset = rowRotateOffset;
    }

    get getColRotateOffset() {
        return this.colRotateOffset;
    }

    set setColRotateOffset(colRotateOffset) {
        this.colRotateOffset = colRotateOffset;
    }

    toggleRowRotateOffset() {
        this.rowRotateOffset = -this.rowRotateOffset;
        return this.rowRotateOffset;
    }

    toggleColRotateOffset() {
        this.colRotateOffset = -this.colRotateOffset;
        return this.colRotateOffset;
    }

    swapRotateOffsets() {
        var temp = this.colRotateOffset;
        this.colRotateOffset = this.rowRotateOffset;
        this.rowRotateOffset = temp;
    }

    get getRotationType() {
        return this.rotationType;
    }

    set setRotationType(rotationType) {
        this.rotationType = rotationType;
    }
}