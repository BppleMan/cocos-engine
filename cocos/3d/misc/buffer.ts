/*
 Copyright (c) 2020 Xiamen Yaji Software Co., Ltd.

 https://www.cocos.com/

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated engine source code (the "Software"), a limited,
 worldwide, royalty-free, non-assignable, revocable and non-exclusive license
 to use Cocos Creator solely to develop games on your target platforms. You shall
 not use Cocos Creator software for developing other software or tools that's
 used for developing games. You are not granted to publish, distribute,
 sublicense, and/or sell copies of Cocos Creator.

 The software or tools in this License Agreement are licensed, not sold.
 Xiamen Yaji Software Co., Ltd. reserves all rights not expressly granted to you.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 */

import { Format, FormatInfos, FormatType, FormatInfo } from '../../gfx';
import { sys } from '../../core';

const _typeMap: Record<string, string> = {
    [FormatType.UNORM]: 'Uint',
    [FormatType.SNORM]: 'Int',
    [FormatType.UINT]: 'Uint',
    [FormatType.INT]: 'Int',
    [FormatType.UFLOAT]: 'Float',
    [FormatType.FLOAT]: 'Float',
    default: 'Uint',
};
function _getDataViewType (info: FormatInfo) {
    const type = _typeMap[info.type] || _typeMap.default;
    const bytes = info.size / info.count * 8;
    return `${type}${bytes}`;
}

// default params bahaves just like on an plain, compact Float32Array
export function writeBuffer (target: DataView, data: number[], format: Format = Format.R32F, offset = 0, stride = 0) {
    const info = FormatInfos[format];
    if (!stride) { stride = info.size; }
    const writer = `set${_getDataViewType(info)}`;
    const componentBytesLength = info.size / info.count;
    const nSeg = Math.floor(data.length / info.count);
    const isLittleEndian = sys.isLittleEndian;

    for (let iSeg = 0; iSeg < nSeg; ++iSeg) {
        const x = offset + stride * iSeg;
        for (let iComponent = 0; iComponent < info.count; ++iComponent) {
            const y = x + componentBytesLength * iComponent;
            target[writer](y, data[info.count * iSeg + iComponent], isLittleEndian);
        }
    }
}
export function readBuffer (
    target: DataView, format: Format = Format.R32F, offset = 0,
    length: number = target.byteLength - offset, stride = 0, out: number[] = [],
) {
    const info = FormatInfos[format];
    if (!stride) { stride = info.size; }
    const reader = `get${_getDataViewType(info)}`;
    const componentBytesLength = info.size / info.count;
    const nSeg = Math.floor(length / stride);
    const isLittleEndian = sys.isLittleEndian;

    for (let iSeg = 0; iSeg < nSeg; ++iSeg) {
        const x = offset + stride * iSeg;
        for (let iComponent = 0; iComponent < info.count; ++iComponent) {
            const y = x + componentBytesLength * iComponent;
            out[info.count * iSeg + iComponent] = target[reader](y, isLittleEndian);
        }
    }
    return out;
}
export function mapBuffer (
    target: DataView, callback: (cur: number, idx: number, view: DataView) => number, format: Format = Format.R32F,
    offset = 0, length: number = target.byteLength - offset, stride = 0, out?: DataView,
) {
    if (!out) { out = new DataView(target.buffer.slice(target.byteOffset, target.byteOffset + target.byteLength)); }
    const info = FormatInfos[format];
    if (!stride) { stride = info.size; }
    const writer = `set${_getDataViewType(info)}`;
    const reader = `get${_getDataViewType(info)}`;
    const componentBytesLength = info.size / info.count;
    const nSeg = Math.floor(length / stride);
    const isLittleEndian = sys.isLittleEndian;

    for (let iSeg = 0; iSeg < nSeg; ++iSeg) {
        const x = offset + stride * iSeg;
        for (let iComponent = 0; iComponent < info.count; ++iComponent) {
            const y = x + componentBytesLength * iComponent;
            const cur = target[reader](y, isLittleEndian);
            // iComponent is usually more useful than y
            out[writer](y, callback(cur, iComponent, target), isLittleEndian);
        }
    }
    return out;
}
