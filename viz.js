let stateObj = {
    mouseCount: 0,
    tmpArr: [],
    tmpCounter: 0,
    clippedCoordinates: []
};



class VizControl {
    constructor(VizView) {
        this.VizView = VizView;
    }
    init() {
        this.VizView.init();
    }
    resetMouseCount() {
        stateObj.mouseCount = 0;
    }
    //include max covered area inside the clicked coordinates
    refineValuesForRectangle() {
        let xmin = d3.min([
            stateObj.tmpArr[0][0],
            stateObj.tmpArr[1][0],
            stateObj.tmpArr[2][0],
            stateObj.tmpArr[3][0]
        ]);
        let xmax = d3.max([
            stateObj.tmpArr[0][0],
            stateObj.tmpArr[1][0],
            stateObj.tmpArr[2][0],
            stateObj.tmpArr[3][0]
        ]);
        let ymin = d3.min([
            stateObj.tmpArr[0][1],
            stateObj.tmpArr[1][1],
            stateObj.tmpArr[2][1],
            stateObj.tmpArr[3][1]
        ]);
        let ymax = d3.max([
            stateObj.tmpArr[0][1],
            stateObj.tmpArr[1][1],
            stateObj.tmpArr[2][1],
            stateObj.tmpArr[3][1]
        ]);

        
stateObj.clippedCoordinates.push({
            name: "clipped-path-" + stateObj.tmpCounter,
            x: xmin,
            y: ymin,
            width: xmax - xmin,
            height: ymax - ymin
        });
    }
    incrementMouseClick() {
        stateObj.mouseCount++;
    }
    addClickedCoordinates(mouse) {
        stateObj.tmpArr.push(mouse);
    }
    updateObjCounter() {
        stateObj.tmpCounter++;
    }
    resetCoordinatesTmpArray() {
        stateObj.tmpArr = [];
    }
}


class VizView {
    //initial svg loading and click function calls
    init() {
        this.renderSvg();
        this.triggerClickActionOnSvg();
        this.renderImage();
    }
    //svg rendering
    renderSvg() {
        d3.select("body")
            .append("svg")
            .attr("class", "image-body")
            .attr("width", "80%")
            .attr("height", "100%")
            .attr("preserveAspectRatio", "none")
            .attr("x", 0)
            .attr("y", 0)
            .style("fill", "#000");

        d3.select("body")
            .append("svg")
            .attr("class", "data-body")
            .attr("width", "19%")
            .attr("height", "100%")
            .attr("preserveAspectRatio", "none")
            .attr("x", 0)
            .attr("y", "71%")
            .style("fill", "#000");
    }
    //add click function on svg
    triggerClickActionOnSvg() {
        let that = this;
        let svg = d3.select(".image-body").on("click", function () {
            let mouse = d3.mouse(this);
            vizApp.incrementMouseClick();
            vizApp.addClickedCoordinates(mouse);
            that.drawClickCircle(mouse[0], mouse[1]);

            if (stateObj.mouseCount == 4) {                
                vizApp.refineValuesForRectangle();
                that.drawSquare();
                vizApp.resetMouseCount();
                vizApp.updateObjCounter();
                vizApp.resetCoordinatesTmpArray()
                that.removeClickCircles()
            }
        });
    }
    removeClickCircles() {
        d3.select(".image-body").selectAll("circle").remove();
    }
    //Image loading
    renderImage() {
        d3.select(".image-body")
            .append("g")
            .attr("width", "100%")
            .attr("height", "100%")
            .attr("preserveAspectRatio", "none")
            .append("image")
            .attr("xlink:href", "aurora.jpg")
            .attr("height", "100%")
            .attr("preserveAspectRatio", "none");
    }
    //adding opacity and rectangle for the selected area
    drawSquare() {
        let svg = d3.select(".image-body");
        this.resetCanvasSelection();
        let mask = svg
            .append("defs")
            .append("mask")
            .attr("id", "myMask");

        mask
            .append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", "100%")
            .attr("height", "100%")
            .attr("preserveAspectRatio", "none")
            .style("fill", "white")
            .style("opacity", 0.7);

        mask
            .selectAll(".opaque-obj")
            .data(stateObj.clippedCoordinates)
            .enter()
            .append("rect")
            .attr("class", "opaque-obj")
            .attr("id", function (d) {
                return d.name;
            })
            .attr("x", function (d) {
                return d.x;
            })
            .attr("y", function (d) {
                return d.y;
            })
            .style("fill", "#000")
            .attr("width", function (d) {
                return d.width;
            })
            .attr("height", function (d) {
                return d.height;
            });

        svg
            .append("rect")
            .attr("class", "opaque-container")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", "100%")
            .attr("height", "100%")
            .attr("preserveAspectRatio", "none")
            .attr("mask", "url(#myMask)")
            .style("fill", "grey")
            .style("opacity", 0.9);

        d3.select(".data-body")
            .selectAll("text")
            .data(stateObj.clippedCoordinates)
            .enter()
            .append("text")
            .attr("class", "select-names")
            .attr("x", 50)
            .attr("y", function (d) {
                return 40 + 40 * parseInt(d.name.replace("clipped-path-", ""));
            })
            .attr("width", 200)
            .attr("height", 100)
            .attr("fill", "#fff")
            .text(function (d) {
                return d.name.replace("-", " ");
            })
            .on("click", function (d) {
                let currentStatus = d3.select("#" + d.name).style("visibility");
                let updateStatus = currentStatus == "hidden" ? "visible" : "hidden";
                d3.select("#" + d.name).style("visibility", updateStatus);
            });

        svg
            .append("g")
            .selectAll(".opaque-obj")
            .data(stateObj.clippedCoordinates)
            .enter()
            .append("rect")
            .attr("class", "opaque-obj")
            .style("fill", "transparent")
            .style("cursor", "grab")
            .call(this.update)
            .call(
                d3.drag().on("drag", function (d) {
                    d3.select(this)
                        .attr("x", (d.x = d3.event.x))
                        .attr("y", (d.y = d3.event.y));

                    d3.select("#" + d3.event.subject.name)
                        .attr("x", (d.x = d3.event.x))
                        .attr("y", (d.y = d3.event.y));
                })
            );
    }
    resetCanvasSelection(){
        d3.select(".image-body").selectAll("defs").remove();
        d3.select(".image-body").selectAll(".opaque-obj").remove();
        d3.select(".image-body").selectAll(".opaque-container").remove();

    }
    //drawing small circles on user click
    drawClickCircle(x, y) {
        d3.select(".image-body")
            .append("circle")
            .attr("class", "click-circle")
            .attr("cx", x)
            .attr("cy", y)
            .attr("r", 4)
            .attr("fill", "transparent")
            .attr("stroke", "cyan")
            .attr("stroke-width", 2);
    }
    //update position of selected elements
    update(selection) {
        selection
            .attr("x", d => d.x)
            .attr("y", d => d.y)
            .attr("width", d => d.width)
            .attr("height", d => d.height);
    }
}

//App Starting Point
const vizView = new VizView();
const vizApp = new VizControl(vizView);
vizApp.init();
