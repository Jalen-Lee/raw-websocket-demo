function parseMessage(buffer) {
  
  // 读取第一个字节
  const firstByte = buffer.readUInt8(0);
  // 获取操作码
  const opCode = firstByte & 0b00001111;
  // 为8时表示已关闭
  if (opCode === 8) {
    return null;
  }
  // 为1表示这是文本帧
  if (opCode !== 1) {
    return;
  }

  // 获取第二个字节
  const secondByte = buffer.readUInt8(1);
  // 掩码位是否为1
  const isMasked = secondByte >>> 7 === 1;
  if (!isMasked) {
    throw new Error("不接受无掩码消息！");
  }

  // 获取掩码
  const maskingKey = buffer.readUInt32BE(2);
  // 偏移量
  let currentOffset = 2+4;
  // 载荷长度
  const messageLength = secondByte & 0x7f;
  if (messageLength > 125) {
    throw new Error("不处理大数据帧！");
  }

  // 分配与载荷长度相同的缓冲区，用于后续转换
  const response = Buffer.alloc(messageLength);
  for (let i = 0; i < messageLength; i++) {
    // 这里按照RFC6455的算法进行转换
    const maskPosition = i % 4;

    let shift;
    if (maskPosition === 3) {
      shift = 0;
    } else {
      shift = (3 - maskPosition) << 3;
    }

    let mask;
    if (shift === 0) {
      mask = maskingKey & 0xff;
    } else {
      mask = (maskingKey >>> shift) & 0xff;
    }
    // 逐个字节进行掩码转换
    const source = buffer.readUInt8(currentOffset);
    // 偏移量指针自增
    currentOffset++;
    response.writeUInt8(mask ^ source, i);
  }

  return JSON.parse(response.toString("utf8"));
}

export default parseMessage;
