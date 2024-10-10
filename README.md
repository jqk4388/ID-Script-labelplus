# ID-Script-labelplus
LabelPlus是一个用于图片翻译的工具包，本脚本可以读取它的翻译文本，并将文本逐条添加到InDesign页面中。
- lines适用于翻译已断句，多行为一个气泡的稿件。
- oneline适用于翻译不断句，一行一个气泡的稿件。

designed for use in manga lettering
#How to use
Id打开漫画的文档indd，将Scripts Panel文件夹放入
C:\Users\xxx\AppData\Roaming\Adobe\InDesign\Version 18.0-J\zh_CN\Scripts
在脚本窗口可看到Label Plus-id脚本
![image](https://github.com/user-attachments/assets/61d00913-12b6-4f5e-bbd6-5fb9a97e0381)
脚本会自动从第一个页面开始放入翻译稿，并且替换！、？为半角，替换——为—
如果页面不够脚本会自动新建，无需手动操作。
脚本会在字符样式、段落样式里找：框内，如果没找到就用基本段落样式，所以提前要导入样式模板。
导入文字后检查下，没问题了可以解锁底部图片层置入底图。
