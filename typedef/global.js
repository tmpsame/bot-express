/**
Object which contains context information.
@typedef {Object} context
@prop {Array.<Object>} to_confirm - Array of parameters to confirm.
@prop {Sting} confirming - Parameter name which Bot is now confirming.
@prop {Object} confirmed - Object which contains confirmed value of the parameters as properties. If you want to retrieve confirmed value of "date" parameter, access confirmed.date.
@prop {Object} previous
@prop {Array.<Object>} previous.confirmed
@prop {Array.<Object>} previous.message
@prop {String} previous.message[].from - "bot" or "user"
@prop {MessageObject} previous.message[].message
*/
