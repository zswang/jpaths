jpaths(#€)
======

[![Build Status](https://img.shields.io/travis/zswang/jpaths/master.svg)](https://travis-ci.org/zswang/jpaths)
[![NPM version](https://img.shields.io/npm/v/jpaths.svg)](http://badge.fury.io/js/jpaths)

## 概述

jpaths 是一个简单绘图类库，兼容 svg、canvas 和 vml。

jpaths 可以说是一个只支持 path 元素简版的 [Raphaël](http://raphaeljs.com/)

如果项目只需要绘制路径，可以选择 jpaths。

## 支持的格式

* M - moveto
* L - lineto
* C - curveto
* Z - closepath

## 使用方法

### 安装
 
* **npm** `$npm install jpaths`
* **bower** `$bower install jpaths`

## API

### 创建 `jpaths` 实例

```javascript
/**
* 创建矢量路径类
* @param {Object} options 配置
 *  @field {String|Element} parent 容器，如果是字符串，则当 id 检索对应元素
 *  @field {String} fill 填充色
 *  @field {Number} fillOpacity 填充透明度
 *  @field {String} stroke 描边色
 *  @field {Number} strokeOpacity 描边透明度
 *  @field {Number} strokeWidth 描边宽度
 *  @field {String} path 路径
 */
jpaths.create = function(options) { ... }
```

### 释放 `jpaths` 实例

```javascript
/**
 * 释放资源
 */
Path.prototype.free = function() { ... }
```

### 操作 `jpaths` 属性

```javascript
/**
 * 设置属性
 * @param {String} name 属性名
 * @param {String} value 属性值
 */
Path.prototype.attr = function(name, value) { ... }

/**
 * 批量设置属性
 * @param {Object} values 属性列表
 */
Path.prototype.attr = function(name, value) { ... }

/**
 * 获取属性
 * @param {String} name 属性名
 */
Path.prototype.attr = function(name) { ... }
```
## 示例

```javascript
void function() {
  var pathBase = jpaths.create({
    parent: 'canvas'
  });

  JSONEditor.defaults.options.theme = 'bootstrap2';
  var editor = new JSONEditor(
    document.getElementById('editor_holder'),
    {
      schema: {
        type: 'object',
        properties: {
          path: {
            title: '路径',
            type: 'string',
            format: 'text',
            default: 'M10,10 L210,10 L210,210 L10,210 Z'
          },
          stroke: {
            title: '边线颜色',
            type: 'string',
            default: '#ff0000',
            format: 'color'
          },
          'stroke-opacity': {
            title: '边线透明度',
            type: 'integer',
            default: 1,
            minimum: 0,
            maximum: 1
          },
          'stroke-width': {
            title: '边线宽度',
            type: 'integer',
            default: 1,
          },
          fill: {
            title: '填充颜色',
            type: 'string',
            default: '#00ff00',
            format: 'color'
          },
          'fill-opacity': {
            title: '填充透明',
            type: 'number',
            default: 1,
            minimum: 0,
            maximum: 1
          }
        }
      }
    }
  );

  editor.on("change",  function() {
    pathBase.attr(editor.getValue());
  });
}();
```
![参考效果](https://cloud.githubusercontent.com/assets/536587/3569229/cb8c5094-0b3b-11e4-93f9-c11f9ad29a97.png)

## 参考文档

* [SVG 1.1 Path data](http://www.w3.org/TR/SVG/paths.html#PathData)