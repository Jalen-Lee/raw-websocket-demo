/**
 * json => buffer
 * @param {*} obj 
 * @returns 
 */
export default function objToResponse(obj) {
  const data = JSON.stringify(obj);
  // 获取数据的字节长度
  const dataBytes = Buffer.byteLength(data);
  /**
   * 如果值是 0~125，就是净荷长度；
   * 如果值是 126，则接下来 2 字节表示的 16 位无符号整数才是这一帧的长度；
   */
  const lengthByteCount = dataBytes < 126 ? 0 : 2;
  const payloadLength = lengthByteCount === 0 ? dataBytes : 126;


  // 分配缓冲区
  const buffer = Buffer.alloc(2 + lengthByteCount + dataBytes);

  // 写入帧首部
  buffer.writeUInt8(0b10000001, 0);
  buffer.writeUInt8(payloadLength, 1);

  let payloadOffset = 2;
  if (lengthByteCount > 0) {
    buffer.writeUInt16BE(dataBytes, lengthByteCount);
    payloadOffset += lengthByteCount;
  }

  // 写入数据
  buffer.write(data, payloadOffset);
  return buffer;
}
