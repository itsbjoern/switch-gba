import unittest
from src import ringbuffer

class RingBufferTest(unittest.TestCase):
    def setUp(self):
        self.buf = ringbuffer.RingBuffer(3)

    def test_append(self):
        self.buf.append(1)
        self.assertEqual(len(self.buf._data), 3)
        self.buf.append(2)
        self.assertEqual(len(self.buf._data), 3)
        self.buf.append(3)
        self.assertEqual(len(self.buf._data), 3)
        self.assertEqual(self.buf._data, [1, 2, 3])

        for i in range(1, 10):
            self.buf.append(i)
        self.assertEqual(self.buf._data, [7, 8, 9])

    def test_get_k_recent(self):
        for i in range(100):
            self.buf.append(i)
            self.assertEqual(self.buf.get_k_recent(1), [i])

        for i in range(100):
            self.buf.append(i)
            if i < 2: # First populate with 2 elements before assertion.
                continue
            self.assertEqual(self.buf.get_k_recent(2), [i - 1, i])

        with self.assertRaises(Exception) as context:
            self.buf.get_k_recent(-1)
            self.assertTrue('Invalid Lookup' in context.exception)
            self.buf.get_k_recent(0)
            self.assertTrue('Invalid Lookup' in context.exception)