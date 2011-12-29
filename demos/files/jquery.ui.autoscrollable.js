/*
 * This file is part of Active Archives.
 * Copyright 2006-2011 the Active Archives contributors (see AUTHORS)
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 * 
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * Also add information on how to contact you by electronic and paper mail.
 */


/* 
Defines:

.animatedsetter, .autoscrollable

*/

(function ($, undefined) {

function log () {
    try { console.log.apply(console, arguments); } catch (e) {}
}

$.animatedsetter = function (opts) {
    // requires getter, setter functions
    
    var o = $.extend({}, $.animatedsetter.defaults, opts);
    var that = {};
    var dest;
    var intervalid = null;
    var lastvalue;
    
    that.set = function (val) {
        dest = val;
        if (intervalid === null) intervalid = window.setInterval(hook, o.intervaltime);
    }

    function hook () {
        // log("animatedsetter.hook");
        var cur = o.getter(); // that.element.scrollTop();
        var delta = (dest - cur); //  (o.animScrollDest - cur);
        // log("*", cur, delta, smax);
        var done = false;
        if (Math.abs(delta) < o.mindelta) {
            done = true;
        } else {
            delta *= o.speedfactor;
            var newvalue = Math.floor(cur + delta);
            done = o.nochangeautostop && (newvalue === lastvalue); // STOPS AUTOMATICALLY WHEN VALUE STOPS CHANGING!
        }
        if (done) {
            // log("animatedsetter.hook: done");
            o.setter(dest); // that.element.scrollTop(o.animScrollDest);
            window.clearInterval(intervalid);
            intervalid = null;
            // ALLOW FOR simple onend CALLBACK
            if (o.end) o.end(); // o.animScrollingReseter.do_soon();
        } else {
            // log("scrollTop", newvalue);
            o.setter(newvalue); // that.element.scrollTop(newvalue);
            lastvalue = newvalue;
        }
    }
    
    return that;
}
$.animatedsetter.defaults = {
    intervaltime: 50,
    mindelta: 1,
    speedfactor: 0.1,
    end: null,
    nochangeautostop: true
}

$.widget("aa.autoscrollable", {
    options: {
        left: 0,
        top: 0,
        valign: "top",
        halign: "left",
        vertical: true,
        horizontal: true,
        hspeedfactor: 0.1,
        vspeedfactor: 0.1
    },

    _create: function () {
        // log("create!");
        this.element.addClass( "aa-autoscrollable" );

        var o = this.options;
        o.interval_id = null;
        o.animScrolling = false;
        o.animScrollDest = null;
        o.animScrollLastValue = null;
        o.disableAutoScroll = false;

        var that = this;
        o.scrollTopSetter = $.animatedsetter({
            getter: function () { return that.element.scrollTop(); },
            setter: function (val) { that.element.scrollTop(val); },
            speedfactor: o.vspeedfactor,
            end: function () {
                that._topdone();
            }
        });
        o.scrollLeftSetter = $.animatedsetter({
            getter: function () { return that.element.scrollLeft(); },
            setter: function (val) { that.element.scrollLeft(val); },
            speedfactor: o.hspeedfactor,
            end: function () {
                that._leftdone();
            }
        });
        o._leftdone = false;
        o._topdone = false;
    },

    _init: function () {
        // log("init!");
        var o = this.options;
        if (o.left) o.left = parseFloat(o.left);
        if (o.top) o.top = parseFloat(o.top);
        var vals = { top: 0.0, center: 0.5, bottom: 1.0, left: 0.0, right: 1.0 };
        o._valign = vals[o.valign] !==undefined ? vals[o.valign] : parseFloat(o.valign);
        o._halign = vals[o.halign] !== undefined ? vals[o.halign] : parseFloat(o.halign);
        // log("align:", o.valign, o.halign);
    },

    _topdone : function () {
        this.options._topdone = true;
        if (this.options._leftdone) this._trigger("stop");            
    },

    _leftdone: function () {
        this.options._leftdone = true;
        if (this.options._topdone) this._trigger("stop");            
    },

    scrollto: function (elt) {
        var o = this.options;
        elt = $(elt, this.element);
        // log("scrollto", elt);

        // GET ELEMENTS POSITION RELATIVE TO this.element (not necessarily the same as elt.position())
        var ep = elt.offset(), op = this.element.offset();
        var left = ep.left - op.left;
        var top = ep.top - op.top;
// Subtract offsetParent borders
//   += parseFloat( jQuery.css(offsetParent[0], "borderTopWidth") ) || 0;

        // correct position to include scrolltop/left
        top +=  this.element.scrollTop();
        left +=  this.element.scrollLeft();

        // apply alignment
        top -= ((this.element.height()-elt.height()) * o._valign);
        left -= ((this.element.width()-elt.width()) * o._halign);

        /* apply offsets */
        top -= o.top;
        left -= o.left;
       
        o._leftdone = false;
        o._topdone = false;
        this._trigger("start");
        o.scrollTopSetter.set(Math.max(0, top));
        o.scrollLeftSetter.set(Math.max(0, left));
    },

    
    destroy: function() {
        // log("destroy");
        this.element.removeClass( "aa-autoscrollable" );
//      this.valueDiv.remove();
        $.Widget.prototype.destroy.apply( this, arguments );
    }

});

})(jQuery);

