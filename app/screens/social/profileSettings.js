import React from 'react';
import { ScrollView, View, StyleSheet, Alert, AsyncStorage, ActivityIndicator } from 'react-native';
import { RkText, RkTextInput, RkAvoidKeyboard, RkTheme, RkStyleSheet } from 'react-native-ui-kitten';
import {data} from '../../data';
import {Avatar} from '../../components';
import {SocialSetting} from '../../components';
import {FontAwesome} from '../../assets/icons';
import {GradientButton} from '../../components';
import LinkedInModal from 'react-native-linkedin';
import firebase from '../../config/firebase';
var firestoreDB = firebase.firestore();

function renderIf(condition, content) {
  if (condition) {
      return content;
  } else {
      return null;
  }
}

export class ProfileSettings extends React.Component {
  static navigationOptions = {
    title: 'Profile Settings'.toUpperCase()
  };

  constructor(props) {
    super(props);
    this.user = data.getUser();
    this.state = {
      // firstName: this.user.firstName,
      // lastName: this.user.lastName,
      // email: this.user.email,
      // phone: this.user.phone,
      isLoading: true,
      password: this.user.password,
      newPassword: this.user.newPassword,
      confirmPassword: this.user.confirmPassword,
      linkedInSummary: '',
      isLinkedInConnected: false,
      linkedInToken: {},
      userDetails: {},
      pictureUrl: 'https://randomuser.me/api/portraits/men/49.jpg'
    }
    this.onLinkedInError = this.onLinkedInError.bind(this);
    this.onLinkedInConnect = this.onLinkedInConnect.bind(this);
    this.getLinkedinProfileDetails = this.getLinkedinProfileDetails.bind(this);
  }

  componentWillMount() {
    let thisRef = this;
    AsyncStorage.getItem("USER_LINKEDIN_TOKEN").then((token)=>{
      if(token){
        thisRef.setState({isLinkedInConnected: true, linkedInToken: JSON.parse(token) });
      }
    });
    AsyncStorage.getItem("USER_DETAILS").then((userDetails)=>{
      let user = JSON.parse(userDetails)
      thisRef.setState({
        userDetails: user,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.contactNo,
        linkedInSummary: user.linkedInSummary,
        isLoading: false,
        pictureUrl: user.pictureUrl ? user.pictureUrl : 'https://randomuser.me/api/portraits/men/49.jpg'
      });
     })
     .catch(err => {
       console.warn('Errors');
     });
  }

  onLinkedInError(error) {
    Alert.alert(
      'Error',
      error.message,
      [
        { text: 'Ok', onPress: () => {} },
      ],
      { cancellable: false }
    );
  }

  onLinkedInConnect(token) {
    AsyncStorage.setItem("USER_LINKEDIN_TOKEN", JSON.stringify(token));
    this.setState({isLinkedInConnected: true, linkedInToken: token});
    this.getLinkedinProfileDetails(true);
  }

  getLinkedinProfileDetails(forceConnect = false) {
    if(this.state.isLinkedInConnected || forceConnect){
      this.setState({ isLoading: true });
      const baseApi = 'https://api.linkedin.com/v1/people/';
      const qs = { format: 'json' };
      const params = [
        'first-name',
        'last-name',
        'industry',
        'summary',
        'picture-url',
        'picture-urls::(original)',
        'headline',
        'email-address',
      ];
      fetch(`${baseApi}~:(${params.join(',')})?format=json`, {
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + this.state.linkedInToken.access_token,
        },
      }).then((response) => {
        this.setState({ isLoading: false });
        response.json().then((payload) => {
          this.setState({linkedInSummary: payload.headline, pictureUrl: payload.pictureUrl});
          firestoreDB.collection('Attendee').doc(this.state.userDetails.uid).set({
              linkedInSummary: payload.headline,
              pictureUrl: payload.pictureUrl
            }, { merge: true })
            .then((docRef) => {
              this.setState({linkedInSummary: payload.headline});
              let userDetailsToSave = this.state.userDetails;
              userDetailsToSave.linkedInSummary = payload.headline;
              userDetailsToSave.pictureUrl = payload.pictureUrl;
              AsyncStorage.setItem("USER_DETAILS", JSON.stringify(userDetailsToSave));
            })
            .catch((error) => {
              console.warn('Error updating summary');
            });
        });        
      })
    } else {
      this.modal.open();
    }    
  }

  render() {
    return (
      <ScrollView style={styles.root}>
        <RkAvoidKeyboard>
          <View style={styles.header}>
            <Avatar imagePath={this.state.pictureUrl} rkType='big'/>
          </View>
          <View style={styles.section}>
            <View style={[styles.row, styles.heading]}>
              <RkText rkType='header6 primary'>INFO</RkText>
            </View>
            <View style={styles.row}>
              <RkTextInput label='First Name'
                           value={this.state.firstName}
                           editable={false}
                           rkType='right clear'
                           onChangeText={(text) => this.setState({firstName: text})}/>
            </View>
            <View style={styles.row}>
              <RkTextInput label='Last Name'
                           value={this.state.lastName}
                           editable={false}
                           onChangeText={(text) => this.setState({lastName: text})}
                           rkType='right clear'/>
            </View>
            <View style={styles.row}>
              <RkTextInput label='Email'
                           value={this.state.email}
                           editable={false}
                           onChangeText={(text) => this.setState({email: text})}
                           rkType='right clear'/>
            </View>
            <View style={styles.row}>
              <RkTextInput label='Phone'
                           value={this.state.phone}
                           editable={false}
                           onChangeText={(text) => this.setState({phone: text})}
                           rkType='right clear'/>
            </View>
          </View>

          <View style={styles.section}>
            <View style={[styles.row, styles.heading]}>
              <RkText rkType='header6 primary'>Linked In Details</RkText>
            </View>
            <View style={styles.row}>
              <RkTextInput label='Summary'
                           value=''
                           rkType='right clear' />
            </View>
            <View style={styles.row}>
              <RkText rkType='header4'>{this.state.linkedInSummary}</RkText>
            </View>
            <GradientButton rkType='large' style={styles.button} text='Update from Linkedin Profile' onPress={() => this.getLinkedinProfileDetails()} />
          </View>
          {/* {renderIf(!this.state.isLinkedInConnected,
            <GradientButton rkType='large' style={styles.button} text='Connect to Linkedin' onPress={() => this.modal.open()} />
          )} */}
        </RkAvoidKeyboard>
        
        <View style={styles.container}>
        <LinkedInModal
          ref={ref => {
            this.modal = ref
          }}
          linkText=''
          clientID="81ri5ss1q7cmvg"
          clientSecret="NNn9HQRcQfLHHF5F"
          redirectUri="http://eternussolutions.com"
          onError={error => this.onLinkedInError(error)}
          onSuccess={token => this.onLinkedInConnect(token) }
        />
        {renderIf(this.state.isLoading,
            <View style={styles.loading}> 
              <ActivityIndicator size='large' /> 
            </View>
          )}
      </View>

      </ScrollView>
    )
  }
}

let styles = RkStyleSheet.create(theme => ({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  root: {
    backgroundColor: theme.colors.screen.base
  },
  header: {
    backgroundColor: theme.colors.screen.neutral,
    paddingVertical: 25
  },
  section: {
    marginVertical: 25
  },
  loading: {
    position: 'absolute',
    left: 0,
    backgroundColor: 'black',
    opacity: 0.8,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center'
  },
  heading: {
    paddingBottom: 12.5
  },
  row: {
    flexDirection: 'row',
    paddingHorizontal: 17.5,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border.base,
    alignItems: 'center'
  },
  button: {
    marginHorizontal: 16,
    marginBottom: 32
  }
}));