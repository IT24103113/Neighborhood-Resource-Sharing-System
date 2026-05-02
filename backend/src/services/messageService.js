function isParticipant(conversation, userId) {
  return conversation.participants.some((participant) => participant.toString() === userId.toString());
}

async function findConversationForParticipants(Conversation, userA, userB) {
  return Conversation.findOne({
    participants: { $all: [userA, userB], $size: 2 }
  });
}

module.exports = {
  isParticipant,
  findConversationForParticipants
};