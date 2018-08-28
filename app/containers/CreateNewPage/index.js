/*
 * Create New Trust Page
 *
 * Page to create trust contracts
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Helmet } from 'react-helmet';
import styled from 'styled-components';
import ContainerCreate from 'components/ContainerCreate';
import Image from '../../images/secure.svg';
import Input from 'components/Input';
import Web3 from '../../utils/core';
import Constants from 'components/Constants';
import Checkbox from 'antd/lib/checkbox';
import LoadingIndicator from 'components/LoadingIndicator';
import ConnectionStatus from 'components/ConnectionStatus';

import 'antd/lib/checkbox/style/css';

const blocksPerSecond = 14;

const StyledTermsAndConditions = styled.s`
  font-size: 12px;
  font-family: 'Roboto';
  margin-bottom: 10px;
  text-decoration: none;

  a{
    color: #1890ff;
  }
`;

const StyledClickHere = styled.s`
  color: #1890ff;
  text-decoration: underline;
`;

const StyledTermsAndConditionsWrapper = styled.div`
  margin-bottom: 10px;
`;

export default class CreateNewPage extends React.Component {
  constructor(props){
    super(props);

    this.state = {
      shouldConfirm: false,
      isLoading: false,
      acceptedToS: false,
    }
    this.details = [];
    this.handleConfirm = this.handleConfirm.bind(this);
    this.handleBack = this.handleBack.bind(this);
    this.handleClose = this.handleClose.bind(this);
    this.handleAlertClosed = this.handleAlertClosed.bind(this);
    this.handleTermsAndConditionsClicked = this.handleTermsAndConditionsClicked.bind(this);
  }

  handleClose(){
    this.setState({
      shouldConfirm: false,
      recepient: '',
      amountEth: '',
      blockNumber: '',
    })
  }

  handleBack(){
    this.setState({shouldConfirm: false})
  }

  async handleConfirm(){
    const { recepient, blockNumber, amountEth } = this.state;
    const { currentBlock } = this.props;

    let alertType = undefined;
    let alertMessage = undefined;
    this.setState({alertType})

    if(this.props.user.myBitBalance < 250){
      alertMessage = <span>Your MYB balance is below 250, click <StyledClickHere onClick={() => BancorConvertWidget.showConvertPopup('buy')}>here</StyledClickHere> to buy more.</span>
    }
    else if(!Web3.utils.isAddress(recepient)){
      alertMessage = "Please enter a valid Ethereum address.";
    }
    else if(!amountEth || amountEth == 0){
      alertMessage = "Amount of ETH needs to be higher than zero.";
    }

    if(alertMessage){
      alertType = 'error';
      this.setState({
        alertType,
        alertMessage
      })
      return;
    }

    //generate details
    this.details = [];
    this.details.push({
      title: 'Recipient',
      content: [Constants.functions.shortenAddress(recepient) + "."]
    }, {
      title: 'Amount',
      content: [amountEth + " ETH"]
    }, {
      title: 'Deliver on Block Number',
      content: [blockNumber + currentBlock]
    })

    this.setState({shouldConfirm: true})
    this.setState({ alertType: 'info', alertMessage: "Waiting for confirmations." });

    console.log("hererere")

    try {
      let result = true;
      if(!this.props.userAllowed){
        result = await this.props.requestApproval();
      }

      console.log(result)

      if(result){
        result = await this.props.createTrust(
          recepient,
          amountEth,
          false,
          blockNumber
        );
      }
      if (result) {
        this.setState({ alertType: 'success', alertMessage: "Transaction confirmed." });
      } else {
        this.setState({ alertType: 'error',  alertMessage: "Transaction failed. Please try again with more gas." });
      }
      this.props.checkAddressAllowed();
      this.props.getTransactions();
    } catch (err) {
      this.setState({ alertType: undefined});
    }
  }

  handleTermsAndConditionsClicked(e){
    this.setState({acceptedToS: e.target.checked});
  }

  handleAlertClosed(){
    this.setState({alertType: undefined})
  }

  handleInputChange(text, id){
    this.setState({
      [id]: text,
    })
  }

  render() {
    let toRender = [];
    if(this.props.loading){
      return <LoadingIndicator />
    }

    toRender.push(
      <ConnectionStatus
        network={this.props.network}
        constants={Constants}
        key={"connection status"}
        loading={this.props.loadingNetwork}
      />
    )

    const content = (
      <div key="content">
        <Input
          placeholder="Recipient"
          value={this.state.recepient}
          onChange={(e) => this.handleInputChange(e.target.value, 'recepient')}
          tooltipTitle="Who will recieve your funds on execution?"
          hasTooltip
        />
        <Input
          placeholder="Amount ETH"
          type="number"
          value={this.state.amountEth}
          onChange={(number) => this.handleInputChange(number, 'amountEth')}
          min={0}
        />
        <Input
          placeholder="Send payment in #blocks"
          type="number"
          value={this.state.blockNumber}
          onChange={(number) => this.handleInputChange(number, 'blockNumber')}
          tooltipTitle="How many blocks until payment is sent? 250 is roughly 1 hour."
          hasTooltip
          min={10}
        />
        <StyledTermsAndConditionsWrapper>
          <Checkbox
            onChange={this.handleTermsAndConditionsClicked}
          >
          <StyledTermsAndConditions>
            I agree to the <a href="#">Terms and Conditions</a>.
          </StyledTermsAndConditions>
          </Checkbox>
        </StyledTermsAndConditionsWrapper>
      </div>
    )

    if(this.state.shouldConfirm){
      toRender.push(
        <ContainerCreate
          key="containerConfirm"
          type="confirm"
          handleClose={this.handleClose}
          handleBack={this.handleBack}
          alertType={this.state.alertType}
          alertMessage={this.state.alertMessage}
          handleAlertClosed={this.handleAlertClosed}
          details={this.details}
        />
      )
    }
    else{
      toRender.push(
        <ContainerCreate
          key="containerCreate"
          type="input"
          image={Image}
          alt="Placeholder image"
          content={content}
          handleConfirm={this.handleConfirm}
          alertType={this.state.alertType}
          alertMessage={this.state.alertMessage}
          handleAlertClosed={this.handleAlertClosed}
          acceptedToS={this.state.acceptedToS}
        />
      )
    }

    return (
      <article>
        <Helmet>
          <title>Create - MyBit Trust</title>
          <meta
            name="Create"
            content="Create a transaction to take place on a given block on the MyBit Trust dApp"
          />
        </Helmet>
        {toRender}
      </article>
    );
  }
}

CreateNewPage.defaultProps = {
  userAllowed: false,
  currentBlock: 0,
};

CreateNewPage.propTypes = {
  userAllowed: PropTypes.bool.isRequired,
  currentBlock: PropTypes.number.isRequired,
  user: PropTypes.shape({
    myBitBalance: PropTypes.number.isRequired,
  }).isRequired,
  loading: PropTypes.bool.isRequired,
  network: PropTypes.string.isRequired,
  loadingNetwork: PropTypes.bool.isRequired,
};
