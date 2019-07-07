class RingBuffer:
    def __init__(self, size):
        self.index = 0
        self._size = size
        self._data = [0] * size

    def append(self, value):
        self._data[self.index] = value
        self.index = (self.index + 1) % self._size

    def get_k_recent(self, k):
        result = list()
        if k <= 0 or k > self._size:
            raise LookupError('Invalid Lookup')
        curr_index = (self.index - k) % self._size
        while k > 0:
            result.append(self._data[curr_index])
            curr_index = (curr_index + 1) % self._size
            k -= 1
        return result
