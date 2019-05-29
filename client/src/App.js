import React, { Component } from "react";
import socketIOClient from 'socket.io-client';
import openSocket from 'socket.io-client';
import logo from "./logo.svg";
import "./App.css";
import "jade";
import {Slider, Handles} from 'react-compound-slider'

const port = 9000;

function arrayfromargs()
{
	return Array.prototype.slice.call(arguments, 0);
}

const debug = function()
{
	var args = arrayfromargs.apply(this, arguments);
	for(var i in args)
	{
		if(args[i] instanceof Array)
		{
			args[i] = args[i].join(' ');
		}
	}
	//args = args.join(' ');
	console.log(args + '\n');
}


const sliderStyle = {  // Give the slider some width
  position: 'relative',
  width: '30%',
  height: 50,
  border: '1px solid darkgrey',
}

const railStyle = {
  position: 'absolute',
  width: '100%',
  height: 10,
  marginTop: 20,
  borderRadius: 20,
  backgroundColor: '#8B9CB6',
}

export function Handle({ // your handle component
  handle: { id, value, percent },
  getHandleProps
}) {
  return (
    <div
      style={{
        left: `${percent}%`,
        position: 'absolute',
        marginLeft: -15,
        marginTop: 15,
        zIndex: 2,
        width: 30,
        height: 20,
        border: 10,
        textAlign: 'left',
        cursor: 'pointer',
        borderRadius: '20%',
        backgroundColor: '#2C4870',
        color: '#000',
      }}
      {...getHandleProps(id)}
    >
      <div style={{ fontFamily: 'Roboto', fontSize: 11, marginTop: -35 }}>
        {value}
      </div>
    </div>
  )
}

class BaseSlider extends Component{
	constructor(props) {
		super(props);
		this.state = {
			value: 0
		};
	}
	render() {
		return (
			<Slider
				rootStyle={sliderStyle}
				domain={[0, 127]}
				values={[127]}
				step={1}
				mode={2}
			>
				<div style={railStyle} />
				<Handles>
					{({ handles, getHandleProps }) => (
						<div className="slider-handles">
							{handles.map(handle => (
								<Handle
									key={handle.id}
									handle={handle}
									getHandleProps={getHandleProps}
								/>
							))}
						</div>
					)}
				</Handles>
			</Slider>
		)
	}
}

class Square extends Component {
	constructor(props) {
		super(props);
		this.state = {
			clicks: 0
		};
	}

  render() {
		return (
	    <button className="square" onClick={() => this.setState({clicks: this.state.clicks + 1})}>
			{this.state.clicks}
			</button>
		)
  }
}

const startSlider = new BaseSlider();

class App extends Component {
    constructor(props) {
        super(props);
        this.state = {
					apiResponse: "",
					greeting: "no greeting",
					accesses:0,
					slider:0,
					presses:0,
					response: "Count is: 0",
					endpoint: "http://localhost:"+port
				};
    }

    callAPI() {
				debug('callAPI');
        fetch("http://localhost:"+port+"/testAPI")
            .then(res => res.json())
            .then(res => this.setState({ greeting: res.greeting , accesses: res.accesses, slider: res.slider , endpoint: res.endpoint}))
            .catch(err => err);
    }

    componentDidMount() {
        this.callAPI();
				//const socket = socketIOClient(this.state.endpoint);

				const socket = openSocket('http://localhost:9001');
				socket.on("FromAPI", data => this.setState(data));
				debug('response:', this.state.response);
				debug('endpoint:', this.state.endpoint);
    }

		handleClick(){
			console.log('Click!');
		}

		renderSquare() {
			return (
				<Square
					value={'Button'}
					onClick={() =>   this.handleClick()}
				/>
			)
		}

    render() {
        return (
            <div className="App">
								<header className="App-header">
										<img src={logo} className="App-logo" alt="logo" />
                    <h1 className="App-title">Welcome to React for Max</h1>
										<p className="App-subtitle">{this.state.accesses} {this.state.slider} </p>
										<p className="Endpoint">Socket address: {this.state.endpoint}</p>
										<BaseSlider/>
                </header>
            </div>
        );
    }
}

//<p className="Button">{this.renderSquare()}</p>



export default App;
