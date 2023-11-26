# Self hosting my website at home

![](/Optimized-homelab.jpg)

This website alongside many others services is hosted in the mini pc you see in the picture above, an Intel Alder Lake Ν95 12th Gen (up to 3,4 GHz) with 16GB DDR4 running Ubuntu server 22.04.3 LTS.

It was a long journey to get here but after many blogs, tutorials, and github issues I finally managed to get everything working. I want to share my experience and hopefully inspire you to do the same. Let's start by answering the basic questions:

### Why self host ?
Because is fun, since I was a kid I was always looking for services to host in my local network for me and my friends, this is how I get into Computer Science in the first place.
Self-hosting is an excelent way to learn new things often hidden by layers in cloud providers, it forces you to dig more about how things work in the system infrastructure and the network layer.

### Why a mini PC ?
Because power consumption is very low (around 15-20W peak). I wanted something reliable but at the same time I don't want to spend more money in electricity, this server will run 24x7. I also like it small, portable and silent. My plan is to be as cloud-independent and efficient as possible.

### Why Ubuntu server ?
Because is probably the most popular Linux distribution, is very well documented and supported. This is a hobby, I don't want to be stuck for days with some issue not well documented online.  
It was important to me to use the server distro without GUI, I wanted to learn more and feel confortable with the command line.

## The network architecture
The next image shows my current setup, is very simple but effective.  

![](/red.drawio.png)

I setup my domain to point to my static public IP address via DNS, then all this traffic is redirected to the Mikrotik router where I have configured some firewall rules to redirect the right traffic to the mini PC where all my services are running in containers. We will see more details about this in the next sections.

## The hardware

### Hardware and costs *(september 2023)*
- Router Mikrotik Hex RB750Gr3 5 ports 1gb: &euro; 62.
- Orange Router Livebox 6: &euro; 0 (provided by my ISP).
- Ace Magician Mini PC plus 16GB RAM Kingston 3200mhz (removed the original 8gb) ~ &euro; 195.
- Eaton 3S UPS 700 DIN: &euro; 121 -This is not necessary but I wanted to protect the hardware from any power surge or outage since I'm running some important services like [Home Assistant](https://www.home-assistant.io/).
- Ethernet cables CAT 8 ~ &euro; 6,50 each.
- A domain name ~ &euro; 7 per year.

I bought one by one all the hardware from Amazon but don't let the cost scare you, I'm sure you can find better deals if you look for second hand hardware or in other marketplaces, all you need to start is a PC.

## Configuring the routers

### ISP Router
I want all the traffic and firewall rules to be managed by the Mikrotik, so I have to configure the ISP router to be in bridge mode, this is not possible with the Orange Router Livebox 6, so I have to configure it to be in DMZ mode. This way all the traffic is forwarded to the Mikrotik and the ISP Router is not doing any Firewall or NAT. No other devices are connected to the ISP Router, I only use it as a fiber modem. Wifi is handled by a Nest Wifi router connected to the Mikrotik in bridge mode.

### Basic configuration in the Mikrotik
I want to keep this blog simple so I won't go into the details, but I will explain the basic configuration I did in the Mikrotik.
- Assign static IPs to all the devices in my network: This way I can easily manage the firewall rules. You can do this in the IP > DHCP Server configuration in the WebFig.
- Redirecting selected traffic to the Mini PC: You can use [dst-nat](https://wiki.mikrotik.com/wiki/Manual:IP/Firewall/NAT) to redirect internet traffic to your server. For example, I want all the traffic from the port 80/443 to be redirected to my mini PC. This way I can host some websites in the mini PC and access it from the internet. You can do this in the IP > Firewall > NAT tab in the WebFig.
- Firewall rules: I want to block all the traffic from the internet to my local network except the traffic I want to allow. You can also do this in the IP > Firewall > Ports or Rules in the WebFig.

## Runing services in the mini PC
I wanted to run all my services in [containers](https://www.docker.com/resources/what-container/), this way I can easily manage them and keep the host OS clean.
If one day everything goes wrong I can reinstall the host OS and "easily" restore the containers with `docker-compose`.

### Docker
I run all my services with [Docker](https://www.docker.com/get-started/) and I only use one `docker-compose.yml` file. Some of the services I run are:
- Home Assistant: for home automation
- Jellyfin: for media streaming
- GoAccess: for web analytics
- Dozzle: for docker logs

There are literally thousands of services you can run at home, you can check [awesome-selfhosted](https://github.com/awesome-selfhosted/awesome-selfhosted) for more inspiration.

## Accessing the services from internet
All these services (ports) are not exposed outside my local network because the server is protected by the Mikrotik firewall and is only allowed to receive internet traffic in ports 80/443.
We need to take some steps to be able to access our services from the internet:

### Setup a domain name
I bought my domain names from namecheap.com but you can buy a domain name from any provider you want.  
Next I setup the `DNS records` to point to my [public IP address](https://whatismyipaddress.com/), this way I can access my services using the domain name instead of an IP.  
Note: Make sure that your public IP address is static, if not you will need to use a [dynamic DNS](https://www.cloudflare.com/learning/dns/glossary/dynamic-dns/) service also.

### Nginx reverse proxy
[Nginx reverse proxy](https://docs.nginx.com/nginx/admin-guide/web-server/reverse-proxy/) allows you to forward requests to/from services, it's very well documented and easy to use.
I use it to redirect the public traffic to the right container in the host using the domain provided.  
For example, for the domain `proderror.eu` I could use the following configuration in my Nginx server:
```
server {
              server_name proderror.eu;
              location / {
                           proxy_pass http://127.0.0.1:3080;
                           proxy_http_version 1.1;
                           proxy_set_header Upgrade $http_upgrade;
                           proxy_set_header Connection 'upgrade';
                           proxy_set_header Host $host;
                           proxy_cache_bypass $http_upgrade;
               }
               ...
        }
```
Now I can access the service running in the port 3080 in the mini PC without exposing the port to the internet.

### Adding HTTPS to the websites
It's highly recommended to use HTTPS in your websites, this way the traffic is encrypted and secure. I use [certbot](https://certbot.eff.org/) for this. It's very easy to setup and it's free.

## Security
This is something that I'm still learning and I know it can be improved more, but I will share some tips that I have learned so far:  
- Do not expose your local network devices.
- Setup a Firewall beetwen your local network and the internet.
- Close all the ports that you are not using.
- Make sure you are not using default passwords in your services and devices.
- Use secure connection (HTTPS) in your websites.

There are other security measures that you can take depending on your infrastructure but for my use case I think this is a good start.  

## Monitoring and alerts
Hosting your own services is fun but you need to make sure that everything is working as expected year around.
I use the following tools to monitor my services:
- [GoAccess](https://goaccess.io/) to monitor the traffic in my websites. 
- [Dozzle](https://dozzle.dev/) to monitor the logs of my containers.
- I check the status of my services and hardware in the [Home Assistant](https://www.home-assistant.io/) dashboard.
- [betterstack.com](https://betterstack.com/) for Uptime monitor of my websites. (a FREE tier is available)

## Backup & data
It's very important to version control your configuration files and backup your data. I use the following tools to backup my data:
- I have my `docker-compose` and other scripts in a private repository in github.com.
- I backup other configuration files to external drives or google drive.

## Closing thoughts
As you see there are a lot of things to consider when hosting your own services but it can be a lot of fun and you will learn a lot in the process, I know I did and I'm still learning.  
I hope you enjoyed this blog post, if you found it useful or you have any suggestion please [let me know](https://twitter.com/depre_cuba).
