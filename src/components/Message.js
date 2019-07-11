import React from "react";
import {Card, Icon, Radio} from "semantic-ui-react";
import { Map, TileLayer, GeoJSON} from 'react-leaflet';
import PropTypes from 'prop-types';

import Moment from "react-moment";
import {deleteMessage} from "../api/Message";

export default class Message extends React.Component {
    constructor(props) {
        super(props);

        this.state = {
            id: props.message.id,
            ticker: props.message.ticker,
            text: Message._replaceMagic(props.message.text),
            geoInformation: JSON.parse(props.message.geo_information),
            creationDate: props.message.creation_date,
            tweetId: props.message.tweet_id || null,
            tweetUser: props.message.tweet_user || null,
            showMap: false
        };
        this._getText = this._getText.bind(this);
        this._deleteMessage = this._deleteMessage.bind(this);
    }

    static _replaceMagic(text) {
        return (text
            .replace(/(https?:\/\/([^\s]+))/g, '<a href="$1" target="_blank">$2</a>')
            .replace(/#(\S+)/g, '<a target="_blank" rel="noopener noreferrer" href="https://twitter.com/search?q=%23$1">#$1</a>')
            .replace(/ @(\S+)/g, ' <a target="_blank" rel="noopener noreferrer" href="https://twitter.com/$1">@$1</a>')
            .replace(/(\w+@\w+.\w+)/g, '<a href="mailto:$1">$1</a>')
            .replace(/(?:\r\n|\r|\n)/g, '<br/>'))
    }

    _getText() {
        return (
            <p dangerouslySetInnerHTML={{__html: this.state.text}}/>
        );
    }

    _deleteMessage(event) {
        deleteMessage(this.state.ticker, this.state.id).then(() => {
            this.props.loadMessages()
        });

        event.preventDefault();
    }

    _renderMapToggle() {
        if( this.state.geoInformation.features.length < 1) return null;
        return(
            <Card.Content>
                <Radio toggle label='Show map' onChange={ (e, data) => this.setState({ showMap: data.checked })}/>
            </Card.Content>
        );
    }

    _renderMap() {
        if( this.state.geoInformation.features.length < 1 || !this.state.showMap) return null;
        return(
            <Map center={[0, 0]} zoom={1} >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <GeoJSON data={this.state.geoInformation} onAdd={this.onGeoInformationAdded} />
            </Map>
        );
    }

    onGeoInformationAdded(event) {
        const leafletLayer = event.target;
        const features = Object.values(leafletLayer._layers);

        if (features.length == 1 && features[0].feature.geometry.type == 'Point') {
            const coords = features[0].feature.geometry.coordinates;
            leafletLayer._map.setView([coords[1], coords[0]], 13);
        } else {
            leafletLayer._map.fitBounds(leafletLayer.getBounds());
        };
    }

    render() {
        let twitterIcon = (this.state.tweetId != null) ? (
            <a href={`https://twitter.com/${this.state.tweetUser}/status/${this.state.tweetId}`} target='_blank'
               rel='noopener noreferrer'><Icon
                name='twitter'/></a>) : (<Icon name='twitter' disabled/>);

        return (
            <Card fluid>
                <Card.Content>
                    <a onClick={this._deleteMessage}>
                        <Icon fitted link color='grey' name='close' style={{float: 'right'}}/>
                    </a>
                    {this._getText()}
                </Card.Content>
                {this._renderMapToggle()}
                {this._renderMap()}
                <Card.Content extra>
                    {twitterIcon}
                    <Moment fromNow>{this.state.creationDate}</Moment>
                </Card.Content>
            </Card>
        );
    }
}

Message.propTypes = {
    message: PropTypes.shape({
        id: PropTypes.number.isRequired,
        ticker: PropTypes.number.isRequired,
        text: PropTypes.string.isRequired,
        creation_date: PropTypes.string.isRequired,
        tweet_id: PropTypes.string,
        tweet_user: PropTypes.string,
    }),
    loadMessages: PropTypes.func.isRequired,
};
