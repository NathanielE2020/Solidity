import React, { Component } from "react";
import SolidityDriveContract from "./contracts/SolidityDrive.json";
import getWeb3 from "./getWeb3";
import  { StyledDropZone } from "react-drop-zone";
import  { FileIcon, defaultStyles } from 'react-file-icon';
import "react-drop-zone/dist/styles.css"
import "bootstrap/dist/css/bootstrap.css"
import fileReaderPullStream from 'pull-file-reader';
import { Table } from "reactstrap";
// import {create} from 'ipfs-http-client';
import ipfs from "./utils/ipfs";
import Moment from "react-moment";
import "./App.css";

// const ipfs = create({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' });

class App extends Component {
  state = { SolidityDrive: [], web3: null, accounts: null, contract: null };

  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      const web3 = await getWeb3();
      

      // Use web3 to get the user's accounts.
      const accounts = await web3.eth.getAccounts();
      
      // Get the contract instance.
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = SolidityDriveContract.networks[networkId];
      
      const instance = new web3.eth.Contract(
        SolidityDriveContract.abi,
        deployedNetwork && deployedNetwork.address,
        
      );
      console.log(instance);
      // Set web3, accounts, and contract to the state, and then proceed with an
      // example of interacting with the contract's methods.
      this.setState({ web3, accounts, contract: instance }, this.getFiles);
      web3.currentProvider.publicConfigStore.on('update', async () => {
        const changedAccounts = await web3.eth.getAccounts();
        this.setState({accounts: changedAccounts});
        this.getFiles();
      });
    } catch (error) {
      // Catch any errors for any of the above operations.
      alert(
        `Failed to load web3, accounts, or contract. Check console for details.`,
      );
      console.error(error);
    }
  };
  
  getFiles = async () => {
    //TODO
try {

  const {accounts, contract } = this.state;
  let filesLength = await contract.methods.getLength().call({from: accounts[0] });
  let files = [];
  for(let i = 0; i < filesLength; i++) {
    let file = await contract.methods.getFile(i).call({ from: accounts[0] });
    files.push(file);
  }
  this.setState({ SolidityDrive: files});

} catch (error) {
  console.log(error);
}
  };

  onDrop = async (file) => {
    //TODO
    
    try {
      const {contract, accounts} = this.state;
    const reader = new window.FileReader();
    reader.readAsArrayBuffer(file);

    reader.onloadend = async () => {
      // console.log(Buffer(reader.result));
      const result = await ipfs.add(Buffer(reader.result));
      console.log(result["path"]);

      const timestamp = Math.round(+new Date() / 1000);
      const type = file.name.substr(file.name.lastIndexOf(".")+1);
      let uploaded = await contract.methods.add(result["path"], file.name, type, timestamp).send({from: accounts[0], gas: 300000});
      console.log(uploaded);
      this.getFiles(); 

    }
    

    } catch (error) {
      console.log(error);
    }
    
  }

  render() {
    const {SolidityDrive} = this.state;
    if (!this.state.web3) {
      return <div>Loading Web3, accounts, and contract...</div>;
    }
    return (
<div className="App">
<div className="container pt-3">
<StyledDropZone onDrop={this.onDrop}/>
<Table> 
  <thead>
    <tr>
      <th width="7%">Type</th>
      <th className="text-left">File Name</th>
      <th className="text-right">Date</th>
    </tr>
  </thead>
  <tbody>     
    {SolidityDrive !== [] ? SolidityDrive.map((item, key)=>(
    <tr>
    <th><FileIcon size={30} extension={item[2]} {...defaultStyles[item[2]]} /></th>
    <th className="text-left"><a href={"https://ipfs.infura.io/ipfs/"+item[0]}>{item[1]}</a></th>
    <th className="text-right"><Moment format="YYYY/MM/DD" unix>{item[3]}</Moment>
    </th>
  </tr>
   
    )) : null}
  </tbody>
</Table>
  </div> 
</div>
    );
  }
}

export default App;
