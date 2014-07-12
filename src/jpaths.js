var jpaths = typeof exports === 'undefined' ? jpaths || {} : exports;

void function(exports) {
  'use strict';
  /**
   * jpaths
   * 一个简单绘图库，兼容 svg、vml、canvas，路径只支持其交集。
   * @author 王集鹄(wangjihu,http://weibo.com/zswang)
   * @version 2014-07-11
   */

  /**
   * 是否 IE
   */
  var ie = document.all && document.attachEvent;
  /**
   * IE 放大的倍数，保证精度
   */
  var ieZoom = 1000;
  /*
   * 是否 IE9+
   */
  var ie9plus = ie && window.XMLHttpRequest && window.addEventListener && document.documentMode >= 9;
  /*
   * 渲染模式 'svg' | 'vml' | 'canvas'
   */
  var renderMode = !ie || ie9plus ? 'svg' : 'vml';
  /*
   * 容器列表，如果容器是一样的，则不用生成新的 svg 对象
   */
  var parentList = [];
    
  /**
   * 格式化函数
   * @param {String} template 模板
   * @param {Object} json 数据项
   */
  function format(template, json) {
    if (typeof template === 'function') { // 函数多行注释处理
      template = String(template).replace(
        /^[^\{]*\{\s*\/\*!?[ \f\t\v]*\n?|[ \f\t\v]*\*\/[;|\s]*\}$/g, // 替换掉函数前后部分
        ''
      );
    }

    return template.replace(/#\{(.*?)\}/g, function(all, key) {
      return json && (key in json) ? json[key] : "";
    });
  }

  /**
   * 解析路径字符串中的详情
   * @param{String} path 路径表达式
   * @return{Array} 返回每个子路径
   */
  function parsePath(path) {
    var current = [0, 0];
    var movePos = [0, 0];
    var result = [];

    String(path).replace(
      /([mlcza])((\s*,?\s*([+-]?\d+(?:\.\d+)?)+)*)/gi,
      function(all, flag, params) {
        switch (flag) {
          case 'M':
          case 'L':
            var passing = false; // 是否已经处理过参数
            params.replace(
              /\s*,?\s*([+-]?\d+(?:\.\d+)?)\s*,?\s*([+-]?\d+(?:\.\d+)?)/gi,
              function(all, x, y) {
                current = [+x, +y];
                result.push([flag === 'L' || passing ? 'L' : 'M', current]);
                passing = true;
                if (flag === 'M') {
                  movePos = current;
                }
              }
            );
            break;
          case 'C':
            params.replace(
              /\s*,?\s*([+-]?\d+(?:\.\d+)?)\s*,?\s*([+-]?\d+(?:\.\d+)?)\s*,?\s*([+-]?\d+(?:\.\d+)?)\s*,?\s*([+-]?\d+(?:\.\d+)?)\s*,?\s*([+-]?\d+(?:\.\d+)?)\s*,?\s*([+-]?\d+(?:\.\d+)?)/gi,
              function(all, x1, y1, x2, y2, x, y) {
                current = [0, 0];
                result.push(['C', [
                  +x1 + current[0], +y1 + current[1],
                  +x2 + current[0], +y2 + current[1],
                  +x + current[0], +y + current[1]
                ]]);
                current = [+x + current[0], +y + current[1]];
            });
            break;
          case 'Z':
            result.push(['Z']);
            current = movePos;
            break;
        }
      }
    );
    return result;
  }

  /**
   * 矢量路径类
   * @param {Object} options 配置
   *    @field {String|Element} parent 容器
   *    @field {String} fill 填充色
   *    @field {Number} fillOpacity 填充透明度
   *    @field {String} stroke 描边色
   *    @field {Number} strokeOpacity 描边透明度
   *    @field {Number} strokeWidth 描边宽度
   *    @field {String} path 路径
   */
  function Path(options) {
    options = options || {};
    if (typeof options.parent === 'string') {
      this.parent = document.getElementById(options.parent);
    } else {
      this.parent = options.parent || document.body;
    }

    this.fill = options.fill || 'none';
    this.fillOpacity = options.fillOpacity || options['fill-opacity'] || 1;
    this.stroke = options.stroke || 'black';
    this.strokeWidth = options.strokeWidth || options['stroke-width'] || 1;
    this.strokeOpacity = options.strokeOpacity || options['stroke-opacity'] || 1;
    this.path = options.path || 'M 0,0';
    
    // 处理相同的容器
    var parentInfo;
    for (var i = parentList.length - 1; i >= 0; i--) {
      var item = parentList[i];
      if (item.parent === this.parent) {
        parentInfo = item;
        break;
      }
    }

    if (/^canvas$/i.test(this.parent.tagName)) {
      renderMode = 'canvas';
      this.pathDetails = parsePath(this.path);
      this.repaint(true);
    }

    var div;
    switch (renderMode) {
      case 'canvas':
        this.canvas = this.parent;
        if (parentInfo) {
          this.canvasPaths = parentInfo.paths;
        } else {
          this.canvasPaths = [];
          var paths = [];
          parentList.push({
            parent: this.parent,
            paths: this.canvasPaths
          });
        }
        this.canvasPaths.push(this);
        this.repaint(true);
        break;
      case 'svg':
        div = document.createElement('div');
        div.innerHTML = format(function() {/*!
<svg width=100% height=100% xmlns="http://www.w3.org/2000/svg">
  <path fill="#{fill}"
    fill-rule="evenodd"
    stroke-linejoin="round"
    fill-opacity="#{fillOpacity}"
    stroke="#{stroke}"
    stroke-opacity="#{strokeOpacity}"
    stroke-width="#{strokeWidth}" d="#{path}"
</svg>
*/}, this);
        this.elementPath = div.lastChild.lastChild;
        if (parentInfo) {
          this.element = parentInfo.element;
          this.element.appendChild(this.elementPath);
        } else {
          this.element = div.lastChild;
          parentList.push({
            parent: this.parent,
            element: this.element
          });
          this.parent.appendChild(this.element);
        }
        break;
      case 'vml':
        div = document.createElement('div');
        this.filled = this.fill == 'none' ? 'f' : 't';
        this.stroked = this.stroke == 'none' ? 'f' : 't';
        this.zoom = ieZoom;
        div.innerHTML = format(function() {
/*!
<v:shape class="jpaths_path_shape jpaths_vml"
  coordsize="#{zoom},#{zoom}"
  stroked="#{stroked}"
  filled="#{filled}"
  path="#{path}">
  <v:stroke class="jpaths_vml"
    opacity="#{strokeOpacity}"
    color="#{stroke}"
    weight="#{strokeWidth}">
  </v:stroke>
  <v:fill class="jpaths_vml"
    opacity="#{fillOpacity}"
    color="#{fill}">
  </v:fill>
</v:shape>
*/}, this);
        this.elementPath = div.lastChild;
        if (parentInfo) {
          this.element = parentInfo.element;
          this.element.appendChild(this.elementPath);
        } else {
          this.element = div;
          div.className = 'jpaths_path_panel';
          parentList.push({
            parent: this.parent,
            element: this.element
          });
          this.parent.appendChild(this.element);
        }
        this.elementFill = this.elementPath.getElementsByTagName('fill')[0];
        this.elementStroke = this.elementPath.getElementsByTagName('stroke')[0];
        break;
    }
  }
  /**
   * 绘制路径
   * @params{Boolean} all 是否全部更新
   * @see http://code.google.com/p/canvg/
   */
  Path.prototype.repaint = function(all) {
    if (!this.canvas) {
      return;
    }
    var context = this.canvas.getContext('2d');
    var i;
    if (!context) return;
    if (all) {
      context.save();
      context.fillStyle = 'transparent';
      context.globalCompositeOperation = 'copy'; // 彻底清除
      context.fillRect(0, 0, this.canvas.width, this.canvas.height);
      context.restore();
      for (i = 0; i < this.canvasPaths.length; i++) {
        this.canvasPaths[i].repaint();
      }
      return;
    }
    if (!this.pathDetails) {
      return;
    }
    context.save();
    context.beginPath();
    var current = [0, 0]; // 当前坐标
    var movePos = [0, 0]; // 位移坐标
    for (i = 0; i < this.pathDetails.length; i++) {
      var item = this.pathDetails[i];
      switch(item[0]) {
        case 'Z':
          context.closePath();
          current = movePos;
          break;
        case 'C':
          context.bezierCurveTo(
            item[1][0],
            item[1][1],
            item[1][2],
            item[1][3],
            item[1][4],
            item[1][5]
          );
          current = [item[1][2], item[1][3]];
          break;
        case 'L':
          current = [item[1][0], item[1][1]];
          context.lineTo(item[1][0], item[1][1]);
          break;
        case 'M':
          current = [item[1][0], item[1][1]];
          movePos = [item[1][0], item[1][1]];
          context.moveTo(item[1][0], item[1][1]);
          break;
        }
      }
      if (this.stroke !== 'none') {
          context.strokeStyle = this.stroke;
          context.stroke();
      }
      context.lineWidth = this.strokeWidth;
      if (this.fill !== 'none') {
          context.fillStyle = this.fill;
          context.fill();
      }
      context.restore();
    };

  /*
   * 设置或获取属性
   * @param {Object} values
   * @param {Boolean} batch 是否正在批处理
   * @or
   * @param {String} name
   * @param {String} value
   * @param {Boolean} batch 是否正在批处理
   * @or
   * @param {String} name
   */
  Path.prototype.attr = function(name, value) {
    if (arguments.length === 1) {
      if (typeof name === 'string') {
        if (name === 'stroke-width') {
          name = 'strokeWidth';
        }
        return this[name];
      }
      if (typeof name === 'object') {
        for (var p in name) {
          this.attr(p, name[p], true);
        }
        return this;
      }
    } else if (arguments.length > 1) {
      switch(name) {
        case 'path':
          if (this.path === value) {
             break;
          }
          this.path = value;
          switch (renderMode) {
            case 'svg':
              this.elementPath.setAttribute('d', value || 'M 0,0');
              break;
            case 'vml':
              this.elementPath.path = String(value || 'M 0,0')
                .replace(/\d+(\.\d+)?/g, function(number) { // 清理小数
                  return parseInt(number * ieZoom);
                })
                .replace(/z/ig, 'X'); // 处理闭合
              break;
            case 'canvas':
              this.pathDetails = parsePath(this.path);
              this.repaint(true);
              break;
          }
          break;
        case 'fill':
          if (this.fill === value) {
            break;
          }
          this.fill = value;
          switch (renderMode) {
            case 'svg':
              this.elementPath.setAttribute('fill', value);
              break;
            case 'vml':
              this.elementPath.Filled = this.filled = this.fill === 'none' ? 'f' : 't';
              this.elementFill.Color = value;
              break;
            case 'canvas':
              if (batch) {
                this.repaint(true);
              }
              break;
          }
          break;
        case 'stroke':
          if (this.stroke === value) {
            break;
          }
          this.stroke = value;
          switch (renderMode) {
            case 'svg':
              this.elementPath.setAttribute('stroke', value);
              break;
            case 'vml':
              this.elementPath.Stroked = this.stroked = this.stroke === 'none' ? 'f' : 't';
              this.elementStroke.Color = value;
              break;
            case 'canvas':
              if (batch) {
                this.repaint(true);
              }
              break;
          }
          break;
        case 'fillOpacity':
        case 'fill-opacity':
          if (this.fillOpacity === value) {
            break;
          }
          this.fillOpacity = value;
          switch (renderMode) {
            case 'svg':
              this.elementPath.setAttribute('fill-opacity', value);
              break;
            case 'vml':
              this.elementFill.Opacity = Math.min(Math.max(0, value), 1);
              break;
            case 'canvas':
              if (batch) {
                this.repaint(true);
              }
              break;
          }
          break;
        case 'strokeOpacity':
        case 'stroke-opacity':
          if (this.strokeOpacity === value) {
            break;
          }
          this.strokeOpacity = value;
          switch (renderMode) {
            case 'svg':
              this.elementPath.setAttribute('stroke-opacity', value);
              break;
            case 'vml':
              this.elementStroke.Opacity = Math.min(Math.max(0, value), 1);
              break;
            case 'canvas':
              if (batch) {
                this.repaint(true);
              }
              break;
          }
          break;
        case 'strokeWidth':
        case 'stroke-width':
          if (this.strokeWidth == value) {
            break;
          }
          this.strokeWidth = value;
          switch (renderMode) {
            case 'svg':
              this.elementPath.setAttribute('stroke-width', value);
              break;
            case 'vml':
              this.elementStroke.weight = value;
              break;
            case 'canvas':
              if (batch) {
                this.repaint(true);
              }
              break;
          }
          break;
      }
      return this;
    }
  };

  function create(options) {
    return new Path(options);
  }

  if (renderMode === 'vml') {
    document.createStyleSheet().cssText = format(
      function() {/*
.#{this}_vml {
  behavior: url(#default#VML);
}
.#{this}_path_shape {
  width: 1px;
  height: 1px;
  padding: 0;
  margin: 0;
  left: 0;
  top: 0;
  position: absolute;
}
.#{this}_path_panel {
  width: 100%;
  height: 100%;
  overflow: hidden;
  padding: 0;
  margin: 0;
  position: relative;
}
*/
      }, 'jpaths'
    );
  }
  exports.create = create;

}(jpaths);