/**
Class to define skill.
@class Skill
@prop {Skill#constructor} constructor - Constructor of skill class. Required/optional parameters can be defined in this function.
@prop {Skill#finish} finish - Function which is triggerd when all the required parameters are collected.
*/

/**
Object which defines how this parameter should be collected, parsed, and reacted.
@typedef {Object} Skill#skill_parameter
@prop {Object} message_to_confirm - Message Object to ask for users the value of this parameter. As for message format, you can use either LINE or Facebook Messenger.
@prop {parser} parser - Function to parse the message from user.
@prop {reaction} reaction - Function to react to the message from user. Reaction runs right after paser returns.
*/

/**
Object which contains one skill parameter.
@typedef {Object} Skill#skill_parameter_container
@prop {Skill#skill_parameter} * - Skill parameter object.
*/

/**
Function which is applied to the message from user to validate the value. You can do not only validating the value but also manipulation.
@typedef {Function} Skill#parser
@param {String|Object} value - Data to parse. In case of text message, its text will be set in string. In case of postback event, data payload will be set in string. In other cases, message object will be set as it is.
@param {context} context - Context information.
@param {Function} resolve - Method to call when parser judges the value fits the parameter. Return the parsed value as its argument.
@param {Function} reject - Method to call when parse judges the value does not fit the parameter. Optionally return the reason as its argument.
@return {Promise} You have to return the response either from resolve or reject function.
*/

/**
Function which is triggered when parser finshed parsing. You can implement custom behavior on collecting parameter  including async action.
@typedef {Function} Skill#reaction
@param {Boolean} error - Flag which indicates if parser accepted the value. When accepted, true is set.
@param {*} value - Parsed value.
@param {context} context - Context information.
@param {Function} resolve - Method to call when reaction succeeeds.
@param {Function} reject - Method to call when reaction fails.
@return {Promise} You have to return the response either from resolve or reject function.
*/

/**
Constructor of skill class. Required/optional parameters can be defined in this function.
@typedef {Function} Skill#constructor
@param {Bot} bot - Toolkit which can be used to access Messenger API, queuing messeage, collecting arbitrary parameter and so on.
@param {Object} event - Event object which triggers this flow.
@prop {Skill#skill_parameter_container} required_parameter - Object to list required parameters for the skill.
@prop {Skill#skill_parameter_container} optional_parameter - Object to list optional parameters for the skill.
@prop {boolean} clear_context_on_finish=false - Flag to flush context information on skill finishes. Set true to flush.
*/

/**
Function which is triggerd when all the required parameters are collected.
@typedef {Function} Skill#finish
@param {Bot} bot - Toolkit which can be used to access Messenger API, queuing messeage, collecting arbitrary parameter and son on.
@param {Object} event - Event object which triggers this flow.
@param {context} context - Context information.
@param {Function} resolve - Method to call when this action succeeds.
@param {Function} reject - Method to call when this aciton fails.
@return {Promise} You have to return the response either from resolve or reject function.
*/
