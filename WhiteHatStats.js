import React, {useEffect, useRef,useMemo} from 'react';
import useSVGCanvas from './useSVGCanvas.js';
import * as d3 from 'd3';

//change the code below to modify the bottom plot view
export default function WhiteHatStats(props){
    //this is a generic component for plotting a d3 plot
    const d3Container = useRef(null);
    //this automatically constructs an svg canvas the size of the parent container (height and width)
    //tTip automatically attaches a div of the class 'tooltip' if it doesn't already exist
    //this will automatically resize when the window changes so passing svg to a useeffect will re-trigger
    const [svg, height, width, tTip] = useSVGCanvas(d3Container);

    const margin = { top: 50, right: 50, bottom: 50, left: 50 };
    const marginTop = 10;
    const marginRight = 10;
    const marginBottom = 20;
    const marginLeft = 50;
    


    //TODO: modify or replace the code below to draw a more truthful or insightful representation of the dataset. This other representation could be a histogram, a stacked bar chart, etc.
    //this loop updates when the props.data changes or the window resizes
    //we can edit it to also use props.brushedState if you want to use linking
    const statisticChart = useMemo(()=>{
        //wait until the data loads
        if(svg === undefined | props.data === undefined){ return }
        svg.selectAll('g').remove();
        svg.selectAll('.barChartLegendRect').remove()
        svg.selectAll('.barChartLegendRectText').remove()
        
        //aggregate gun deaths by state
        const data = props.data.states;
        
        //get data for each state
        const plotData = [];
        for(let state of data){
            let entry = {
                'abreviation': state.abreviation,
                'count': state.count,
                'name': state.state,
                'population': state.population,
                'genderRatio': state.male_count/state.count,
                'Gun_Deaths_per_100000': Math.round(((state.count * 100000) / state.population) * 10) / 10,
                'male_count': state.male_count,
                'female_count': state.count - state.male_count,
            }
            plotData.push(entry)
        }

        const keys = Object.keys(plotData[0]).slice(6)
        const stack = d3.stack().keys(keys)(plotData)
        
        //convert data for stack bar chart
        stack.map((d,i) => {
            d.map(d => {
              d.key = keys[i]
              return d
            })
            return d
          })
        
          //calcualte the max gundeath value
        const yMax = d3.max(plotData, d => {
            var val = 0
            for(var k of keys){
                val += d[k]
            }
            return val
        })
        
        const xScale = d3.scaleBand().domain(plotData.map(d => d.abreviation)).range([marginLeft, width - marginRight]).padding(0.1);

        const yScale = d3.scaleLinear().domain([0, yMax]).range([height - marginBottom, marginTop])
        svg.selectAll('g').remove();
        svg.selectAll('g')
            .data(stack).enter()
            .append('g')
            .selectAll('rect')
            .data(d => d).enter()
            .append('rect')
                .attr('x', d => xScale(d.data.abreviation))
                .attr('y', d => yScale(d[1]))
                .attr('id',d => d.data.name)
                .attr('width', xScale.bandwidth())
                .attr('height', d => {
                    return yScale(d[0])-yScale(d[1])
                })
                .attr('fill', d => d.key == 'male_count' ? 'brown' : 'yellow')
                .attr('opacity', 0.75)
                .attr('stroke', 'black')
                .attr('stroke-width', 1)
                .on('mouseover',(e,d)=>{
                    let state = d.data.name;
                    if(props.brushedState !== state){
                        props.setBrushedState(state);
                    }
                    let string = '<strong>' + d.data.name.replaceAll('_',' ') + '</strong>' + '</br>'
                        + '<div class="toolTipTextStyle">' + 'Gun Deaths:&nbsp;&nbsp;' + '<p class="toolTipFont">' + d.data.count + '</p>' + '</div>'
                        + '<div class="toolTipTextStyle">' + 'Gun Deaths per 100K:&nbsp;&nbsp;' + '<p class="toolTipFont">' + d.data.Gun_Deaths_per_100000 + '</p>' + '</div>'
                        + '<div class="toolTipTextStyle">' + 'Males :&nbsp;&nbsp;' + '<p class="toolTipFont">' + d.data.male_count + '</p>' + '</div>'
                        + '<div class="toolTipTextStyle">' + 'Females :&nbsp;&nbsp;' + '<p class="toolTipFont">' + d.data.female_count + '</p>' + '</div>'
                    props.ToolTip.moveTTipEvent(tTip,e)
                    tTip.html(string)
                }).on('mousemove',(e)=>{
                    props.ToolTip.moveTTipEvent(tTip,e);
                }).on('mouseout',(e,d)=>{
                    props.setBrushedState();
                    props.ToolTip.hideTTip(tTip);
                });

        svg.append('g')
            .call(d3.axisBottom(xScale))
            .attr('transform', `translate(0,${height - marginBottom})`)

        svg.append('g')
            .call(d3.axisLeft(yScale).tickFormat(d3.format('.2s')))
            .attr('transform', `translate(${marginLeft},0)`)
        svg.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('x', -height / 2)
            .attr('y', marginLeft / 2 - 10)
            .attr('text-anchor', 'middle')
            .text('Number of Deaths per 100K Population');
        svg.append('text')
            .attr('x', width / 2)
            .attr('y', height)
            .attr('text-anchor', 'middle')
            .text('State');
        
        function drawStateLegend(){

            let bounds = svg.node().getBBox();

            svg.append("rect").attr('class','barChartLegendRect').attr("x", bounds.x + bounds.width - 95).attr("y",bounds.y+0).attr("width", 90).attr("height", 20).style("fill", "brown")
            svg.append("rect").attr('class','barChartLegendRect').attr("x", bounds.x + bounds.width - 95).attr("y",bounds.y + 50).attr("width", 110).attr("height", 20).style("fill", "yellow")
            svg.append("text").attr('class','barChartLegendRectText').attr("x", bounds.x + bounds.width - 95).attr("y",bounds.y + 10).text("Male victims").attr("alignment-baseline","middle")
            svg.append("text").attr('class','barChartLegendRectText').attr("x", bounds.x + bounds.width - 95).attr("y",bounds.y + 60).text("Female victims").attr("alignment-baseline","middle")
        }

        drawStateLegend()

        return svg
    },[svg, props.data, props.setBrushedState, props.brushedState]);

    useMemo(()=>{
        if(statisticChart !== undefined){
            const isStateBrushed = props.brushedState !== undefined;
            if(isStateBrushed){
                statisticChart.select('#'+props.brushedState)
                    .attr('opacity',1)
                    .attr('strokeWidth',20);
            }
        }
    },[statisticChart, props.brushedState]);

    return (
        <div
            className={"d3-component"}
            style={{'height':'99%','width':'99%'}}
            ref={d3Container}
        ></div>
    );
}