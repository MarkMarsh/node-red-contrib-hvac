/*jslint devel: true, node: true, indent: 4*/
/**
* Copyright (c) 2015 Mark Marsh
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
* http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
**/

// Node for Node-Red that outputs a nicely formatted string from a date/time
// object or string using the hvac.js library.

module.exports = function(RED) {
    "use strict";
    
    // require hvac.js (must be installed from package.js as a dependency)
    var hvac      = require("hvac")
        //parseFormat = require('hvac-parseformat') // More input options // NOT WORKING
    ;
    
    // The main node definition - most things happen in here
    function FormatDateTime(n) {
        // Create a RED node
        RED.nodes.createNode(this,n);
        
        // Store local copies of the node configuration (as defined in the .html)
        this.topic = n.topic;
        this.input = n.input;
        this.format = n.format;
        this.output = n.output;

        // copy "this" object in case we need it in context of callbacks of other functions.
        var node = this;
        
        // send out the message to the rest of the workspace.
        // ... this message will get sent at startup so you may not see it in a debug node.
        // Define OUTPUT msg...        
        //var msg = {};
        //msg.topic = this.topic;
        //msg.payload = "Hello world !"
        //node.send(msg);
        
        // respond to inputs....
        node.on('input', function (msg) {
            // If the node's topic is set, copy to output msg
            if ( node.topic !== '' ) {
                msg.topic = node.topic;
            } // If nodes topic is blank, the input msg.topic is already there
            
            // make sure input property is set, if not, assume msg.payload
            if ( node.input === '' ) {
                node.input = 'payload';
                node.warn('Input field is REQUIRED, currently blank, set to msg.payload');
            }
            // make sure output property is set, if not, assume msg.payload
            if ( node.output === '' ) {
                node.output = 'payload';
                node.warn('Output field is REQUIRED, currently blank, set to msg.payload');
            }

            // Make sure that the node's input property actually exists on the input msg
            var inp = '';
            if ( node.input in msg ) {
                // It is so grab it
                inp = msg[node.input];
            } else {
                node.warn('Input property, ' + node.input + ', does NOT exist in the input msg. Output has been set to a blank string.');
            }
            // If inp is a blank string, set it to a Date object with Now DT
            if ( inp === '' ) {
                inp = new Date();
            }

            // We are going to overwrite the output property without warning or permission!
            
            // Get a Moment.JS date/time - NB: the result might not be
            //  valid since the input might not parse as a date/time
            var mDT = hvac(inp);
            // Check if the input is a date?
            if ( ! mDT.isValid() ) {
                node.warn('The input property was NOT a recognisable date. Output will be a blank string');
                msg[node.output] = '';
            } else {
                // Handle different format strings. We allow any fmt str that
                // Moment.JS supports but also some special formats
                
                // If format not set, assume ISO8601 string if input is a Date otherwise assume Date
                
                if ( node.format === '' ) {
                    // Is the input a JS Date object? If so, output a string
                    // Is it a number (Inject outputs a TIMESTAMP which is a number), also output a string
                    if ( hvac.isDate(inp) || Object.prototype.toString.call(inp) === '[object Number]') {
                        msg[node.output] = mDT.toISOString();
                    } else {                    // otherwise, output a Date object
                        msg[node.output] = mDT.toDate();
                    }
                } else if ( node.format.toUpperCase() === 'ISO8601'  || node.format.toLowerCase() === 'iso' ) {
                    msg[node.output] = mDT.toISOString();
                } else if ( node.format.toLowerCase() === 'fromnow' || node.format.toLowerCase() === 'timeago' ) {
                    // We are also going to handle time-from-now (AKA time ago) format
                    msg[node.output] = mDT.fromNow();
                } else if ( node.format.toLowerCase() === 'calendar' || node.format.toLowerCase() === 'aroundnow' ) {
                    // We are also going to handle calendar format (AKA around now)
                    msg[node.output] = mDT.calendar();
                } else if ( node.format.toLowerCase() === 'date' || node.format.toLowerCase() === 'jsdate' ) {
                    // we also allow output as a Javascript Date object
                    msg[node.output] = mDT.toDate();
                } else {
                    // or we assume it is a valid format definition ...
                    msg[node.output] = mDT.format(node.format);
                }
            }
            
            // in this example just send it straight on... should process it here really
            node.send(msg);
        });
        
        // Tidy up if we need to
        //node.on("close", function() {
            // Called when the node is shutdown - eg on redeploy.
            // Allows ports to be closed, connections dropped etc.
            // eg: node.client.disconnect();
        //});
    }
    // Register the node by name. This must be called before overriding any of the
    // Node functions.
    RED.nodes.registerType("hvac",FormatDateTime);
}
