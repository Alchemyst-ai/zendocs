const saveDocToFile = (doc: {
  data: {
    title: string;
    result: { content: string; timestamp: number; title: string };
  };
  success: boolean;
}) => {
  const { data } = doc;
  const { result } = data;
  const { content, title, timestamp } = result;
};
