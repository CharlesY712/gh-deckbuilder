import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import './DeckBuilder.css';
import AvailableCards from '../AvailableCards/AvailableCards';
import SelectedCards from '../SelectedCards/SelectedCards';
import * as api from '../../api/index';
import * as helpers from '../../helpers/index';
import { 
  addCards, 
  addSelectedCards, 
  addAvailableCards, 
  addSelectedClass,
  increaseCurrentLevel,
  decreaseCurrentLevel,
  removeSelectedCards
  } from '../../actions';

export class DeckBuilder extends Component {
  constructor(props) {
    super(props);
    this.feedbackDiv = React.createRef();
    this.deckSaveButton = React.createRef();
    this.deckSaveDiv = React.createRef();
    this.deckSaveName = React.createRef();
    this.deckReset = React.createRef();
    this.changeClassButton = React.createRef();
    this.changeClassDiv = React.createRef();
    this.changeClassSelect = React.createRef();
    this.state = {
      deckName: 'Unnamed Deck',
      background: require('../../images/background/background.png'),
      classImage: require('../../images/classArtwork/pending.png'),
      feedback: 'Here is your feedback!',
      error: ''
    };
  };


  async componentDidMount() {
    try {
      const selectedClass = await this.getAllCards()
      this.getImages(selectedClass)
      this.props.addSelectedClass(selectedClass)
    } catch (error) {
      this.setState({ error });
    }
  }

  async componentDidUpdate(prevProps) {
    if (prevProps.location !== this.props.location) {
      try {
        const selectedClass = await this.getAllCards()
        this.getImages(selectedClass)
        this.props.addSelectedClass(selectedClass)
      } catch (error) {
        this.setState({ error });
      }
    }
  }

  async getAllCards() {
    const { addCards, addSelectedCards, addAvailableCards, selectedDeck } = this.props
    const selectedClass = this.props.location.pathname.slice(1);
    const cards = await api.fetchCards(selectedClass);
    const deck = await helpers.getSelected(selectedDeck, cards);
    const available = await helpers.getAvailable(cards, deck.cards);
    this.setState({deckName: deck.name})
    addCards(cards);
    addSelectedCards(deck.cards);
    addAvailableCards(available);
    return selectedClass
  }

  getImages(selectedClass) {
    const dynamicImage = require(`../../images/classArtwork/${selectedClass}FullBody.png`)
    const dynamicBackground = require(`../../images/background/background-${selectedClass}.png`)
    this.setState({
      classImage: dynamicImage,
      background: dynamicBackground})
    document.body.style = `background-image: url(${this.state.background});`;
  }

  displayFeedback(message) {
    this.setState({ feedback: message });
    this.feedbackDiv.current.classList.remove('hidden');
  }

  hideFeedback(event) {
    event.target.classList.add('hidden');
  }

  changeLevel(operator) {
    const { currentLevel, increaseCurrentLevel, decreaseCurrentLevel } = this.props
    if(operator === 'plus'){
      currentLevel < 9 ? increaseCurrentLevel() : this.displayFeedback('Maximum level is already selected.')
    } else if(operator === 'minus') {
      currentLevel > 1 ? decreaseCurrentLevel() : this.displayFeedback('Minimum level is already selected.')
    }
  }

  toggleDeckSave() {
    const buttonText = this.deckSaveButton.current.innerText === "Save Deck" 
      ? "Cancel"
      : "Save Deck"
    this.deckSaveDiv.current.classList.toggle('hidden');
    this.deckSaveButton.current.innerText = buttonText;
    this.deckReset.current.classList.toggle('hidden');
    this.changeClassButton.current.classList.toggle('hidden');
    if(this.deckSaveButton.current.innerText === "Save Deck") {
      this.displayFeedback('Save cancelled.')
    }
  }

  toggleChangeClass(event) {
    console.log(event)
    // this.changeClassSelect.current.value = this.props.selectedClass;
    this.changeClassDiv.current.classList.toggle('hidden');
    this.changeClassButton.current.classList.toggle('hidden');
    this.deckSaveButton.current.classList.toggle('hidden');
    this.deckReset.current.classList.toggle('hidden');
    if (event.target.id === 'cancel-class-change') {
      this.displayFeedback('Change class cancelled.')
    }
  }

  async submitDeck(event) {
    event.preventDefault();
    const name = this.deckSaveName.current.value;
    const selectedClass = this.props.selectedClass;
    const level = this.props.currentLevel;
    const cards = this.props.selectedCards.map( card => {return card.id});
    console.log(name)
    console.log(selectedClass)
    console.log(level)
    console.log(cards)
    await api.fetchPostDeck(name, selectedClass, level, cards);
  }

  async resetDeck() {
    const { removeSelectedCards, addSelectedCards, addAvailableCards, cards, selectedDeck } = this.props
    if(selectedDeck === 0) {
      removeSelectedCards();
      addAvailableCards(this.props.cards)
      this.displayFeedback('All selected cards cleared.')
    } else {
      const deck = await helpers.getSelected(selectedDeck, cards);
      const available = await helpers.getAvailable(cards, deck.cards);
      addSelectedCards(deck.cards);
      addAvailableCards(available);
      this.displayFeedback('Selected Cards reverted to saved deck.')
    }
  }

  changeClass(event) {
    this.props.history.push(`/${event.target.id}`);
    this.toggleChangeClass(event)
  }
  
  render() {
    const { selectedClass, 
      selectedCards, 
      currentLevel } = this.props;
    const numberSelectedCards = selectedCards.length;
    const handSize = helpers.getHandSize(selectedClass);

    return (
      <div className="deck-builder">  
        <AvailableCards location={this.props.location} />
        <div id="class-info">
          <img src={this.state.classImage}
            alt={selectedClass}/>
          <div id="feedback-container" 
            className="hidden" 
            ref={this.feedbackDiv}
            onClick={this.hideFeedback}>
            <img src={require('../../images/feedback-bg.png')}
              alt="feedback" />
            <div id="feedback-content">
              <p>{this.state.feedback}</p>
            </div>
          </div>
          <h2>{selectedClass}</h2>
          <h5>{this.state.deckName}</h5>
          <div id="stats">
            <h4>Cards Selected</h4>
            <p id="number-cards">{numberSelectedCards} &nbsp; of &nbsp; {handSize}</p>
            <h4>Character Level</h4> 
            <div id="level-container">
              <button id="decrease-level" 
                className="inline-button"
                onClick={() => { this.changeLevel('minus') }} ></button>
              <h3>{currentLevel}</h3>
              <button id="increase-level" 
                className="inline-button"
                onClick={() => { this.changeLevel('plus') }} ></button>
            </div>
            <button onClick={this.toggleChangeClass.bind(this)}
              ref={this.changeClassButton}>
              Change Class
              </button>
            <button onClick={this.toggleDeckSave.bind(this)}
              ref={this.deckSaveButton}>
              Save Deck
            </button>
            <div id="deck-save-container" 
              className="hidden" 
              ref={this.deckSaveDiv}>
              <form>
                <input id="deck-name" 
                  type="text" 
                  placeholder="Enter deck name."
                  ref={this.deckSaveName}/>
                <button id="submit-deck-name" 
                  onClick={this.submitDeck.bind(this)}>Submit</button>
              </form>
            </div>
           <button onClick={this.resetDeck.bind(this)}
              ref={this.deckReset}>
              Reset Deck
            </button>
            <div id="change-class-container" 
              className="hidden" 
              ref={this.changeClassDiv}>
              <button id="cancel-class-change" 
                onClick={this.toggleChangeClass.bind(this)}>
                Cancel
                </button>
                <div id="class-select-container">
                  <ul>
                    <li id="Brute" onClick={this.changeClass.bind(this)}>Brute</li>
                    <li id="Cragheart" onClick={this.changeClass.bind(this)}>Cragheart</li>
                    <li id="Mindthief" onClick={this.changeClass.bind(this)}>Mindthief</li>
                  </ul>
                  <ul>
                    <li id="Spellweaver" onClick={this.changeClass.bind(this)}>Spellweaver</li>
                    <li id="Scoundrel" onClick={this.changeClass.bind(this)}>Scoundrel</li>
                    <li id="Tinkerer" onClick={this.changeClass.bind(this)}>Tinkerer</li>
                  </ul>
                </div>
            </div>
          </div>
        </div>
        <SelectedCards location={this.props.location} />
      </div>
    )
  }
};

export const mapDispatchToProps = dispatch => ({
  addCards: cards => dispatch(addCards(cards)),
  addSelectedCards: selectedCards => dispatch(addSelectedCards(selectedCards)),
  addAvailableCards: availableCards => dispatch(addAvailableCards(availableCards)),
  addSelectedClass: selectedClass => dispatch(addSelectedClass(selectedClass)),
  increaseCurrentLevel: currentLevel => dispatch(increaseCurrentLevel(currentLevel)),
  decreaseCurrentLevel: currentLevel => dispatch(decreaseCurrentLevel(currentLevel)),
  removeSelectedCards: () => dispatch(removeSelectedCards())
});

export const mapStateToProps = state => ({
  cards: state.cards,
  selectedCards: state.selectedCards,
  availableCards: state.availableCards,
  selectedClass: state.selectedClass,
  currentLevel: state.currentLevel,
  selectedDeck: state.selectedDeck
});

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(DeckBuilder));
