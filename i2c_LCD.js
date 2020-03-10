
module.exports = function(RED)
{



  //NOTICE!!!!
  //I know there are better, less verbose, less code length,  ways to write this code
  //I have made it easy to edit later. I worte it so I can expand options if needed
  //If you want to condense it feel free :P
  //
  //Licensed under the Apache License, Version 2.0
  // 2018 David L Burrows
  //Contact me @ https://github.com/meeki007
  //or meeki007@gmail.com

  //Globals for NODES
  //on deploy start set true so lcd is only triggered once
  var first_deploy;
  // see if input node is deployed
  var deployed_i2c_LCD_Input;
  var deployed_i2c_LCD_Output;
  //require adafruit-i2c-lcd node
  var LCDPLATE, lcd;
  LCDPLATE = require('adafruit-i2c-lcd').plate;



  function callLCDplate(var_for_i2c_device_number, var_for_i2c_address, var_for_polling_ms)
  {
    if ( first_deploy == true )
    {
      first_deploy = false;
      lcd = new LCDPLATE(var_for_i2c_device_number, var_for_i2c_address, var_for_polling_ms);
    }
  }


  function i2c_LCD_Output(config)
  {


    RED.nodes.createNode(this, config);
    var node = this;
    //when redeploying  nodes reset state!!!!
    this.on('close', function()
    {
      deployed_i2c_LCD_Output = false;
      first_deploy = false;
    });

    //determin if node is deployed
    deployed_i2c_LCD_Output = true;
    first_deploy = true;



    // config
    this.manufacturer = config.manufacturer || "adafruit";
    this.i2c_device_number = Number(config.i2c_device_number || 1);
    this.i2c_address = config.i2c_address || "0x20";
    this.Line1 = config.Line1||"Line1";
    this.Line2 = config.Line2||"Line2";
    this.settings = config.settings || "Basic";
    //BASIC
    //Add color select for manufacturer if settings are set to basic
    this.basic_screen_color = config.basic_screen_color || "ON";
    this.timeLimitType = config.timeLimitType || "seconds";
    this.timeLimit = Number(config.timeLimit || 3);
    // calculate time limit in milliseconds
    if( this.timeLimitType === "hours" ) {
        this.timeLimit *= 60 * 60 * 1000;
    }
    else if( this.timeLimitType === "minutes" ) {
        this.timeLimit *= 60 * 1000;
    }
    else if( this.timeLimitType === "seconds" ) {
        this.timeLimit *= 1000;
    }
    //Advanced
    this.advanced_clear = config.advanced_clear||"clear";
    this.advanced_close = config.advanced_close||"close";
    this.advanced_color = config.advanced_color||"color";
    this.advanced_char0 = config.advanced_char0||"char0";
    this.advanced_char1 = config.advanced_char1||"char1";
    this.advanced_char2 = config.advanced_char2||"char2";
    this.advanced_char3 = config.advanced_char3||"char3";
    this.advanced_char4 = config.advanced_char4||"char4";
    this.advanced_char5 = config.advanced_char5||"char5";
    this.advanced_char6 = config.advanced_char6||"char6";
    this.advanced_char7 = config.advanced_char7||"char7";

    //global for node
    var function_led_off;
    var timmer_led_off;
    //convert hexadec i2c address to a number, must do it this way for user display else it converts it
    var the_i2c_address = Number(this.i2c_address);
    //for getting the test stored in a msg
    var text_in_line1;
    var text_in_line2;
    //var for manipulating custom char string
    var char_value;

    //functions
    function sendthemessage()
    {
      //check to see if msg was sent to the msg.line1 & Line2
      if ( ((text_in_line1 != null) && (text_in_line1 != undefined)) && ((text_in_line2 != null) && (text_in_line2 != undefined)) )
      {

        if ( text_in_line1.indexOf('\'') > -1 )
        {
          text_in_line1 = text_in_line1.replace(/'/g, "\\x27");
        }
        if ( text_in_line2.indexOf('\'') > -1 )
        {
          text_in_line1 = text_in_line1.replace(/'/g, "\\x27");
        }

        //fix escape char
        text_in_line1 = '\''+text_in_line1+'\'';
        text_in_line2 = '\''+text_in_line2+'\'';
        //send message

        lcd.writeByte(0x80); // 0x80 = first line on lcd
        lcd.writeByte(eval(text_in_line1), true);
        lcd.writeByte(0xC0); // 0xC0 = second line on lcd
        lcd.writeByte(eval(text_in_line2), true);


      }
      //check to see if msg was sent to the msg.line1 & nothing sent to Line2
      else if ( ((text_in_line1 != null) && (text_in_line1 != undefined)) && ((text_in_line2 == null) || (text_in_line2 == undefined)) )
      {
        if ( text_in_line1.indexOf('\'') > -1 )
        {
          text_in_line1 = text_in_line1.replace(/'/g, "\\x27");
        }

        //fix escape char
        text_in_line1 = '\''+text_in_line1+'\'';
        //send message
        lcd.writeByte(0x80); // 0x80 = first line on lcd
        lcd.writeByte(eval(text_in_line1), true);
      }
      //check to see if msg was sent to the msg.line2 & nothing sent to Line1
      else if ( ((text_in_line2 != null) && (text_in_line2 != undefined)) && ((text_in_line1 == null) || (text_in_line1 == undefined)) )
      {
        if ( text_in_line2.indexOf('\'') > -1 )
        {
          text_in_line1 = text_in_line1.replace(/'/g, "\\x27");
        }

        //fix escape char
        text_in_line2 = '\''+text_in_line2+'\'';
        //send message
        lcd.writeByte(0xC0); // 0xC0 = second line on lcd
        lcd.writeByte(eval(text_in_line2), true);
      }
    }
    function store_custom_char(number, get_Message_Property)
    {
      //get text sent to msg.char
      char_value = get_Message_Property;
      //check to see if msg was sent
      if ( ( char_value != null ) && ( char_value != undefined ) )
      {
        char_value = '['+char_value+']';
        lcd.createChar(number, eval(char_value));
      }
    }

    function is_a_number_check(theNumbervar, nameofcheck, example_range, numbertype)
    {
      if( isNaN(theNumbervar) || !isFinite(theNumbervar) )
      {
        return node.error("Please only use a " + numbertype + " !--> Your "+ nameofcheck +" is not a reconized " + numbertype + " !. "+ nameofcheck +" example: " + example_range + ". For more information please read the documentation.");
      }
    }
    function number_range_check(theNumbervar, startofrang, endofrange, startofrangestring, endofrangestring, nameofcheck, numbertype)
    {
      if( (theNumbervar < startofrang) || (theNumbervar > endofrange) )
      {
        return node.error("Please only use a " + numbertype + " ! from " + startofrangestring + " to " + endofrangestring + " ---> Your "+ nameofcheck +" is not in reconized rang!. For more information please read the documentation.");
      }
    }


    //clear status icon
    node.status({});

    //Check to see that i2c minor device number at the end of (i2c-0 to i2c-256) is a number and between 0 and 256
//device number
    is_a_number_check(this.i2c_device_number, 'i2c device number', 'i2c-0 to i2c-256, only enter the  number at the end', 'Number');
    number_range_check(this.i2c_device_number, 0, 256, '0', '256', 'i2c device number', 'Number');

    //Check to see that i2c address is a number and between 0x20=32 and 0x27=39
//i2c address
    is_a_number_check(this.i2c_address, 'i2c device address', '0x20 to 0x27', 'Hexadecimal');
    number_range_check(this.i2c_address, 0x20, 0x27, '0x20', '0x27', 'i2c device address', 'Hexadecimal');

//Line1
    // if Line1 of msg.* is empty, null or undefined then warn user and stop do not pass go
    if ( (this.Line1 === null) || (this.Line1 === undefined) )
    {
      return this.error("msg Line1 was not set. Please set msg Line1 to not be null or a undefined value");
    }
//Line2
    // if Line2 of msg.* is empty, null or undefined then warn user and stop do not pass go
    if ( (this.Line2 === null) || (this.Line2 === undefined) )
    {
      return this.error("msg Line2 was not set. Please set msg Line2 to not be null or a undefined value");
    }

    //Now that we have some basic checks we can
    //initalize LCDPLATE function if not allready
    if ( ( first_deploy == true ) && ( deployed_i2c_LCD_Input == true ) )
    {
      //do nothing as the input node handles polling
      lcd.clear();
      lcd.backlight(lcd.colors.OFF);
      //lcd.writeByte('polling enabled', true);
    }
    else if ( ( first_deploy == true ) && ( deployed_i2c_LCD_Output == true ) )
    {
      callLCDplate(this.i2c_device_number, the_i2c_address, -1);
      //turn on for testing
      //lcd.clear();
      //lcd.backlight(lcd.colors.ON);
      //lcd.writeByte('polling disabled', true);
    }


    //when node gets a input
    this.on("input", function(msg)
    {
      //get text sent to msg.line1
      text_in_line1 = RED.util.getMessageProperty(msg,node.Line1);
      //get text sent to msg.line2
      text_in_line2 = RED.util.getMessageProperty(msg,node.Line2);

      //clear status icon
      node.status({});


      //**************************************************************************************
      // If user settings == Basic
      if (this.settings == "Basic")
      {
        // time frame
        if( isNaN(this.timeLimit) || !isFinite(this.timeLimit) )
        {
          return this.error("Please only enter numbers! ---->  \"Off After\" the setting for how long to wait to turn off the screen is NOT numeric. Please only enter numbers!", msg);
        }

        // vars
        //OPTIONS Basic
        //screen colors
        var b_screen_colors = lcd.colors.ON;
        switch (this.basic_screen_color)
        {
          case "OFF":
          b_screen_colors = lcd.colors.OFF;
          break;
          case "RED":
          b_screen_colors = lcd.colors.RED;
          break;
          case "GREEN":
          b_screen_colors = lcd.colors.GREEN;
          break;
          case "BLUE":
          b_screen_colors = lcd.colors.BLUE;
          break;
          case "YELLOW":
          b_screen_colors = lcd.colors.YELLOW;
          break;
          case "TEAL":
          b_screen_colors = lcd.colors.TEAL;
          break;
          case "VIOLET":
          b_screen_colors = lcd.colors.VIOLET;
          break;
          case "WHITE":
          b_screen_colors = lcd.colors.WHITE;
          break;
          case "ON":
          b_screen_colors = lcd.colors.ON;
          break;
        }
        // ADAFRUIT ***************
        if ( this.manufacturer == "adafruit" )
        {
          //Clear the plate of msg's
          lcd.clear();
          //turn on the light and set color
          lcd.backlight(b_screen_colors);
          //send the msg to the screen
          sendthemessage();
          //function for turning off screen after user defined time
          function_led_off = function()
          {
            lcd.clear();
            lcd.backlight(lcd.colors.OFF);
          };
          //clear the timmer if new msg arraives . basicly reset the countdown
          clearTimeout(timmer_led_off);
          //call the function and set time to execute
          timmer_led_off = setTimeout(function_led_off, this.timeLimit);
        }
        // Sainsmart ***************
        else
        {
          //Clear the plate of msg's
          lcd.clear();
          // set color NOTE sainsmart does not turn on the led
          lcd.backlight(b_screen_colors);
          // Sainsmart 1602 I2C backlight on
          lcd.sendBytes(0, 0x1F);
          //send the msg to the screen
          sendthemessage();
          //clear the timmer if new msg arraives . basicly reset the countdown
          clearTimeout(timmer_led_off);
          //call the function and set time to execute
          timmer_led_off = setTimeout(function_led_off, this.timeLimit);
        }
      }
      //**************************************************************************************
      // If user settings == Advanced
      else if (this.settings == "Advanced")
      {
//clear
        // if clear of msg.* is empty, null or undefined then warn user and stop do not pass go
        if ( (this.advanced_clear === null) || (this.advanced_clear === undefined) )
        {
          return this.error("msg \"clear\" was not set. Please set msg \"clear\" to not be null or a undefined value", msg);
        }

//close
        // if close of msg.* is empty, null or undefined then warn user and stop do not pass go
        else if ( (this.advanced_close === null) || (this.advanced_close === undefined) )
        {
          return this.error("msg \"close\" was not set. Please set msg \"close\" to not be null or a undefined value", msg);
        }
//color
        // if color of msg.* is empty, null or undefined then warn user and stop do not pass go
        else if ( (this.advanced_color === null) || (this.advanced_color === undefined) )
        {
          return this.error("msg \"color\" was not set. Please set msg \"color\" to not be null or a undefined value", msg);
        }
//char0
        // if char0 of msg.* is empty, null or undefined then warn user and stop do not pass go
        else if ( (this.advanced_char0 === null) || (this.advanced_char0 === undefined) )
        {
          return this.error("msg char0 was not set. Please set msg char0 to not be null or a undefined value", msg);
        }
//char1
        // if char1 of msg.* is empty, null or undefined then warn user and stop do not pass go
        else if ( (this.advanced_char1 === null) || (this.advanced_char1 === undefined) )
        {
          return this.error("msg char1 was not set. Please set msg char1 to not be null or a undefined value", msg);
        }
//char2
        // if char2 of msg.* is empty, null or undefined then warn user and stop do not pass go
        else if ( (this.advanced_char2 === null) || (this.advanced_char2 === undefined) )
        {
          return this.error("msg char2 was not set. Please set msg char2 to not be null or a undefined value", msg);
        }
//char3
        // if char3 of msg.* is empty, null or undefined then warn user and stop do not pass go
        else if ( (this.advanced_char3 === null) || (this.advanced_char3 === undefined) )
        {
          return this.error("msg char3 was not set. Please set msg char3 to not be null or a undefined value", msg);
        }
//char4
        // if char4 of msg.* is empty, null or undefined then warn user and stop do not pass go
        else if ( (this.advanced_char4 === null) || (this.advanced_char4 === undefined) )
        {
          return this.error("msg char4 was not set. Please set msg char4 to not be null or a undefined value", msg);
        }
//char5
        // if char5 of msg.* is empty, null or undefined then warn user and stop do not pass go
        else if ( (this.advanced_char5 === null) || (this.advanced_char5 === undefined) )
        {
          return this.error("msg char5 was not set. Please set msg char5 to not be null or a undefined value", msg);
        }
//char6
        // if char6 of msg.* is empty, null or undefined then warn user and stop do not pass go
        else if ( (this.advanced_char6 === null) || (this.advanced_char6 === undefined) )
        {
          return this.error("msg char6 was not set. Please set msg char6 to not be null or a undefined value", msg);
        }
//char7
        // if char7 of msg.* is empty, null or undefined then warn user and stop do not pass go
        else if ( (this.advanced_char7 === null) || (this.advanced_char7 === undefined) )
        {
          return this.error("msg char7 was not set. Please set msg char7 to not be null or a undefined value", msg);
        }
        // moving on
        else
        {
//clear, values inside of message
          //get text sent to msg.clear
          var text_in_clear = RED.util.getMessageProperty(msg,node.advanced_clear);
          //check to see if msg was sent to the msg.clear if not set to boolian false
          if ( ( text_in_clear == null ) || ( text_in_clear == undefined ) )
          {
            text_in_clear = false;
          }
          //if clear is sent a non boolian do not pass go!
          else if (text_in_clear == true )
          {
            lcd.clear();
          }
          else if ( text_in_clear == false )
          {
            //do nothing
          }
          else
          {
              return this.error("msg of \"clear\" was not a reconized boolian. Please send true or 1, false or 0, or send nothing and it will be set to = false", msg);
          }
//close, values inside of message
          //get text sent to msg.close
          var text_in_close = RED.util.getMessageProperty(msg,node.advanced_close);
          //check to see if msg was sent to the msg.clear if not set to boolian false
          if ( ( text_in_close == null ) || ( text_in_close == undefined ) )
          {
            text_in_close = false;
          }
          //if clear is sent a non boolian do not pass go!
          else if (text_in_close == true )
          {
            lcd.close();
          }
          else if ( text_in_close == false )
          {
            //do nothing
          }
          else
          {
              return this.error("msg of \"close\" was not a reconized boolian. Please send true or 1, false or 0, or send nothing and it will be set to = false", msg);
          }

//color, values inside of message
          //get text sent to msg.color
          var text_in_color = RED.util.getMessageProperty(msg,node.advanced_color);
          //check to see if msg was sent to the msg.clear if not set to boolian false so no line will be sent
          if ( ( text_in_color == null ) || ( text_in_color == undefined ) )
          {
            text_in_color = false;
          }
          else
          {
            if ( this.manufacturer == "adafruit" )
            {
              //screen colors
              switch (text_in_color)
              {
                case "OFF":
                lcd.backlight(lcd.colors.OFF);
                break;
                case "RED":
                lcd.backlight(lcd.colors.RED);
                break;
                case "GREEN":
                lcd.backlight(lcd.colors.GREEN);
                break;
                case "BLUE":
                lcd.backlight(lcd.colors.BLUE);
                break;
                case "YELLOW":
                lcd.backlight(lcd.colors.YELLOW);
                break;
                case "TEAL":
                lcd.backlight(lcd.colors.TEAL);
                break;
                case "VIOLET":
                lcd.backlight(lcd.colors.VIOLET);
                break;
                case "WHITE":
                lcd.backlight(lcd.colors.WHITE);
                break;
                case "ON":
                lcd.backlight(lcd.colors.ON);
                break;
                case false:
                //if false do nothing
                break;
                default:
                return this.error("msg of \"color\" was not a reconized color. Please send ON, OFF, WHITE, VIOLET, TEAL, YELLOW, BLUE, GREEN, RED, or send nothing to not update color", msg);
              }
            }
            else //sainsmart
            {
              //screen colors
              switch (text_in_color)
              {
                case "OFF":
                lcd.backlight(lcd.colors.OFF);
                // Sainsmart 1602 I2C backlight off
                lcd.sendBytes(0, 0x3F);
                break;
                case "RED":
                lcd.backlight(lcd.colors.RED);
                // Sainsmart 1602 I2C backlight on
                lcd.sendBytes(0, 0x1F);
                break;
                case "GREEN":
                lcd.backlight(lcd.colors.GREEN);
                // Sainsmart 1602 I2C backlight on
                lcd.sendBytes(0, 0x1F);
                break;
                case "BLUE":
                lcd.backlight(lcd.colors.BLUE);
                // Sainsmart 1602 I2C backlight on
                lcd.sendBytes(0, 0x1F);
                break;
                case "YELLOW":
                lcd.backlight(lcd.colors.YELLOW);
                // Sainsmart 1602 I2C backlight on
                lcd.sendBytes(0, 0x1F);
                break;
                case "TEAL":
                lcd.backlight(lcd.colors.TEAL);
                // Sainsmart 1602 I2C backlight on
                lcd.sendBytes(0, 0x1F);
                break;
                case "VIOLET":
                lcd.backlight(lcd.colors.VIOLET);
                // Sainsmart 1602 I2C backlight on
                lcd.sendBytes(0, 0x1F);
                break;
                case "WHITE":
                lcd.backlight(lcd.colors.WHITE);
                // Sainsmart 1602 I2C backlight on
                lcd.sendBytes(0, 0x1F);
                break;
                case "ON":
                lcd.backlight(lcd.colors.ON);
                // Sainsmart 1602 I2C backlight on
                lcd.sendBytes(0, 0x1F);
                break;
                case false:
                //if false do nothing
                break;
                default:
                return this.error("msg of \"color\" was not a reconized color. Please send ON, OFF, WHITE, VIOLET, TEAL, YELLOW, BLUE, GREEN, RED, or send nothing to not update color", msg);
              }
            }
          }
//char, values inside custom characters
          store_custom_char(0, RED.util.getMessageProperty(msg,node.advanced_char0));
          store_custom_char(1, RED.util.getMessageProperty(msg,node.advanced_char1));
          store_custom_char(2, RED.util.getMessageProperty(msg,node.advanced_char2));
          store_custom_char(3, RED.util.getMessageProperty(msg,node.advanced_char3));
          store_custom_char(4, RED.util.getMessageProperty(msg,node.advanced_char4));
          store_custom_char(5, RED.util.getMessageProperty(msg,node.advanced_char5));
          store_custom_char(6, RED.util.getMessageProperty(msg,node.advanced_char6));
          store_custom_char(7, RED.util.getMessageProperty(msg,node.advanced_char7));

//Line1 & Line2, values inside of Lines
          sendthemessage();


        }
      }
    });
  }
  RED.nodes.registerType("i2c_LCD_Output", i2c_LCD_Output);












































  function i2c_LCD_Input(config)
  {


    RED.nodes.createNode(this, config);
    var node = this;



    //determin if node is deployed
    deployed_i2c_LCD_Input = true;
    first_deploy = true;

    // config
    this.manufacturer = config.manufacturer || "adafruit";
    this.i2c_device_number = Number(config.i2c_device_number || 1);
    this.i2c_address = config.i2c_address || "0x20";
    this.i2c_polling = Number(config.i2c_polling || 200);

    var button_name = this.ButtonName;
    var button_state = this.ButtonState;

    //Globals
    var the_i2c_address = Number(this.i2c_address);
    if ( ( first_deploy == true ) && ( deployed_i2c_LCD_Input == true ) )
    {
      callLCDplate(this.i2c_device_number, the_i2c_address, this.i2c_polling);
      //turn on for testing
      //lcd.clear();
      //lcd.backlight(lcd.colors.ON);
      //lcd.writeByte('polling enabled', true);
    }

    function is_a_number_check(theNumbervar, nameofcheck, example_range, numbertype)
    {
      if( isNaN(theNumbervar) || !isFinite(theNumbervar) )
      {
        return node.error("Please only use a " + numbertype + " !--> Your "+ nameofcheck +" is not a reconized " + numbertype + " !. "+ nameofcheck +" example: " + example_range + ". For more information please read the documentation.");
      }
    }
    function number_range_check(theNumbervar, startofrang, endofrange, startofrangestring, endofrangestring, nameofcheck, numbertype)
    {
      if( (theNumbervar < startofrang) || (theNumbervar > endofrange) )
      {
        return node.error("Please only use a " + numbertype + " ! from " + startofrangestring + " to " + endofrangestring + " ---> Your "+ nameofcheck +" is not in reconized rang!. For more information please read the documentation.");
      }
    }


    //Check to see that i2c minor device number at the end of (i2c-0 to i2c-256) is a number and between 0 and 256
//device number
    is_a_number_check(this.i2c_device_number, 'i2c device number', 'i2c-0 to i2c-256, only enter the  number at the end', 'Number');
    number_range_check(this.i2c_device_number, 0, 256, '0', '256', 'i2c device number', 'Number');

    //Check to see that i2c address is a number and between 0x20=32 and 0x27=39
//i2c address
    is_a_number_check(this.i2c_address, 'i2c device address', '0x20 to 0x27', 'Hexadecimal');
    number_range_check(this.i2c_address, 0x20, 0x27, '0x20', '0x27', 'i2c device address', 'Hexadecimal');

    //Check to see that i2c polling is a number
//i2c polling
    is_a_number_check(this.i2c_polling, 'Polling in ms', '40 milliseconds to 500 milliseconds, only enter the  number', 'Number in milliseconds');
    number_range_check(this.i2c_polling, 40, 500, '40', '500', 'i2c device number', 'Number');





    //clear status icon
    node.status({});



    //What to do if a button is pressed
    function displayButton(state, button)
    {
      //TESTING for shoing button press on lcd
      //lcd.backlight(lcd.colors.ON);
      //lcd.clear();
      //lcd.message('Buttn: ' + lcd.buttonName(button) + '\nState: ' + state);

      node.send({button_name:lcd.buttonName(button), button_state:state});

    }

    //register events to show button press/release

    lcd.on('button_down', function(button)
    {
      displayButton('pressed', button);
    });

    lcd.on('button_up', function(button)
    {
      displayButton('released', button);
    });

    //when redeploying  nodes reset state!!!!
    this.on('close', function()
    {
      deployed_i2c_LCD_Input = false;
      first_deploy = false;
      callLCDplate(this.i2c_device_number, the_i2c_address, -1);
    });

  }
  RED.nodes.registerType("i2c_LCD_Input", i2c_LCD_Input);
};
